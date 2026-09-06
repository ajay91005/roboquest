import { XMLParser, XMLValidator } from "fast-xml-parser";

export type Check = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};
export type Validation = {
  passed: boolean;
  checks: Check[];
  links: number;
  joints: number;
};
type Element = {
  "@name"?: string;
  "@type"?: string;
  parent?: { "@link": string };
  child?: { "@link": string };
  origin?: { "@xyz"?: string; "@rpy"?: string };
  axis?: { "@xyz": string };
  limit?: Record<string, string>;
  visual?: Element | Element[];
  collision?: Element | Element[];
  geometry?: {
    box?: { "@size": string };
    cylinder?: { "@radius": string; "@length": string };
    sphere?: { "@radius": string };
  };
};
const list = (value: Element | Element[] | undefined): Element[] =>
  value ? (Array.isArray(value) ? value : [value]) : [];
const vector = (value: unknown, size: number) =>
  typeof value === "string" &&
  value.trim().split(/\s+/).length === size &&
  value
    .trim()
    .split(/\s+/)
    .every((part) => Number.isFinite(Number(part)));

export function validateUrdf(source: string): Validation {
  try {
    return validateDescription(source);
  } catch {
    return {
      passed: false,
      links: 0,
      joints: 0,
      checks: [
        {
          id: "shape",
          label: "Valid URDF element structure",
          passed: false,
          detail:
            "Check nested XML elements and attribute types against the URDF schema.",
        },
      ],
    };
  }
}

function validateDescription(source: string): Validation {
  const checks: Check[] = [];
  const add = (id: string, label: string, passed: boolean, detail: string) =>
    checks.push({ id, label, passed, detail });
  const safe =
    source.length <= 100_000 &&
    !/<!DOCTYPE|<!ENTITY|<\s*(?:\w+:)?mesh\b|<\s*xacro:|<\s*texture\b/i.test(
      source,
    );
  const syntax = safe && XMLValidator.validate(source) === true;
  add(
    "xml",
    "Well-formed, self-contained URDF",
    syntax,
    "Use XML under 100 KB with primitive geometry. Expand XACRO offline; meshes, textures and entities are disabled.",
  );
  if (!syntax) return { passed: false, checks, links: 0, joints: 0 };
  const document = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    processEntities: false,
  }).parse(source);
  const robot = document.robot;
  if (
    !robot ||
    typeof robot !== "object" ||
    Array.isArray(robot) ||
    !robot["@name"]
  ) {
    add(
      "robot",
      "Named robot root",
      false,
      'Wrap the model in one <robot name="rover_mk1"> element.',
    );
    return { passed: false, checks, links: 0, joints: 0 };
  }
  const links = list(robot.link);
  const joints = list(robot.joint);
  if (links.length > 200 || joints.length > 199)
    throw new Error("Model exceeds teaching sandbox limits");
  const names = links.map((link) => link["@name"] ?? "");
  const jointNames = joints.map((joint) => joint["@name"] ?? "");
  add(
    "names",
    "Unique link and joint names",
    links.length > 0 &&
      names.every((name) => typeof name === "string" && name.length > 0) &&
      new Set(names).size === names.length &&
      jointNames.every((name) => typeof name === "string" && name.length > 0) &&
      new Set(jointNames).size === joints.length,
    "Give every link and joint a unique, non-empty name.",
  );
  const parents = new Map<string, string>();
  let treeValid = true;
  for (const joint of joints) {
    const parent = joint.parent?.["@link"] ?? "";
    const child = joint.child?.["@link"] ?? "";
    if (
      !names.includes(parent) ||
      !names.includes(child) ||
      parent === child ||
      parents.has(child)
    )
      treeValid = false;
    parents.set(child, parent);
  }
  for (const name of names) {
    const visited = new Set<string>();
    let current = name;
    while (parents.has(current)) {
      if (visited.has(current)) {
        treeValid = false;
        break;
      }
      visited.add(current);
      current = parents.get(current)!;
    }
  }
  const roots = names.filter((name) => !parents.has(name));
  add(
    "tree",
    "One connected, acyclic transform tree",
    treeValid && roots.length === 1 && roots[0] === "base_footprint",
    "Every child needs one existing parent. The only root must be base_footprint.",
  );
  const jointValid = joints.every((joint) => {
    if (
      !["fixed", "continuous", "revolute", "prismatic"].includes(
        joint["@type"] ?? "",
      )
    )
      return false;
    if (
      joint.origin &&
      ((joint.origin["@xyz"] !== undefined &&
        !vector(joint.origin["@xyz"], 3)) ||
        (joint.origin["@rpy"] !== undefined &&
          !vector(joint.origin["@rpy"], 3)))
    )
      return false;
    if (joint["@type"] === "fixed") return true;
    if (
      !joint.axis ||
      !vector(joint.axis["@xyz"], 3) ||
      joint.axis["@xyz"]
        .trim()
        .split(/\s+/)
        .every((part: string) => Number(part) === 0)
    )
      return false;
    if (joint["@type"] === "continuous") return true;
    const limit = joint.limit;
    return (
      !!limit &&
      [
        limit["@lower"],
        limit["@upper"],
        limit["@effort"],
        limit["@velocity"],
      ].every(
        (value) => value !== undefined && Number.isFinite(Number(value)),
      ) &&
      Number(limit["@lower"]) < Number(limit["@upper"]) &&
      Number(limit["@effort"]) > 0 &&
      Number(limit["@velocity"]) > 0
    );
  });
  add(
    "joints",
    "Joint axes, origins and motion limits",
    jointValid,
    "Moving joints need a nonzero axis. Revolute/prismatic joints need ordered limits and positive effort and velocity.",
  );
  let geometryValid = links.some((link) => list(link.visual).length > 0);
  const positive = (value: unknown) =>
    value !== undefined &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0 &&
    Number(value) <= 10;
  for (const link of links)
    for (const visual of [...list(link.visual), ...list(link.collision)]) {
      const geometry = visual.geometry;
      if (!geometry || Object.keys(geometry).length !== 1) {
        geometryValid = false;
        continue;
      }
      if (geometry.box)
        geometryValid &&=
          vector(geometry.box["@size"], 3) &&
          geometry.box["@size"].trim().split(/\s+/).every(positive);
      else if (geometry.cylinder)
        geometryValid &&=
          positive(geometry.cylinder["@radius"]) &&
          positive(geometry.cylinder["@length"]);
      else if (geometry.sphere)
        geometryValid &&= positive(geometry.sphere["@radius"]);
      else geometryValid = false;
      if (visual.origin?.["@xyz"] !== undefined)
        geometryValid &&= vector(visual.origin["@xyz"], 3);
      if (visual.origin?.["@rpy"] !== undefined)
        geometryValid &&= vector(visual.origin["@rpy"], 3);
    }
  add(
    "geometry",
    "Finite primitive geometry",
    geometryValid,
    "Use boxes, cylinders or spheres with positive dimensions up to 10 m and finite visual origins.",
  );
  const required = [
    "base_footprint",
    "base_link",
    "left_wheel",
    "right_wheel",
    "lidar_link",
    "arm_base",
    "upper_arm",
    "forearm",
    "tool0",
  ];
  add(
    "frames",
    "Mobile manipulator frames",
    required.every((name) => names.includes(name)) &&
      [
        ["base_ground", "base_footprint", "base_link", "fixed"],
        ["left_wheel_joint", "base_link", "left_wheel", "continuous"],
        ["right_wheel_joint", "base_link", "right_wheel", "continuous"],
        ["lidar_joint", "base_link", "lidar_link", "fixed"],
        ["arm_mount", "base_link", "arm_base", "fixed"],
        ["shoulder_joint", "arm_base", "upper_arm", "revolute"],
        ["elbow_joint", "upper_arm", "forearm", "revolute"],
      ].every(([name, parent, child, type]) =>
        joints.some(
          (joint) =>
            joint["@name"] === name &&
            joint.parent?.["@link"] === parent &&
            joint.child?.["@link"] === child &&
            joint["@type"] === type,
        ),
      ),
    "Keep Rover's named wheel and arm joints, their original parents, children and joint types.",
  );
  const toolJoint = joints.find((joint) => joint.child?.["@link"] === "tool0");
  const toolPosition = String(toolJoint?.origin?.["@xyz"] ?? "")
    .trim()
    .split(/\s+/)
    .map(Number);
  add(
    "tool",
    "Tool transform: forearm to tool0",
    toolJoint?.parent?.["@link"] === "forearm" &&
      toolJoint?.["@type"] === "fixed" &&
      toolPosition.length === 3 &&
      toolPosition.every(
        (value, index) => Math.abs(value - [0, 0, 0.28][index]) < 0.0001,
      ),
    'Attach tool0 to forearm with a fixed joint at xyz="0 0 0.28". A tool attached to base_link will not follow the arm.',
  );
  return {
    passed: checks.every((check) => check.passed),
    checks,
    links: links.length,
    joints: joints.length,
  };
}
