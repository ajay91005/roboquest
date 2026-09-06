import assert from "node:assert/strict";
import test from "node:test";
import { localHint } from "../src/lib/mentor";
import { starterUrdf } from "../src/lib/robot";
import { validateUrdf } from "../src/lib/validate-urdf";
import { parseProgress } from "../src/lib/progress";
import { simulatePid } from "../src/lib/control";
import { curriculum } from "../src/lib/curriculum";

test("mentor hints progress from concept to minimal code", () => {
  const result = validateUrdf(starterUrdf);
  assert.match(localHint(result, 1), /kinematic chain/);
  assert.match(localHint(result, 2), /base_link/);
  assert.match(localHint(result, 3), /<parent link="forearm"\/>/);
});
test("local mentor answers curriculum questions without requiring a successful URDF build", () => {
  const result = validateUrdf(starterUrdf);
  assert.match(
    localHint(result, 1, "How do PID gains work?"),
    /persistent error/,
  );
  assert.match(
    localHint(result, 1, "Can I fuse LiDAR in an EKF?"),
    /does not directly fuse raw LaserScan/,
  );
  assert.match(
    localHint(result, 1, "Can you execute Python?"),
    /does not execute/,
  );
});
test("progress parser handles malformed saves and deduplicates milestones", () => {
  assert.deepEqual(parseProgress(null).completed, []);
  assert.deepEqual(
    parseProgress({
      completed: ["mechanics", "mechanics", 7],
      snippets: { urdf: 10 },
    }).completed,
    ["mechanics"],
  );
  assert.equal(
    typeof parseProgress({ snippets: { urdf: 5 } }).snippets.urdf,
    "string",
  );
});
test("all curriculum phases have a valid checkpoint and practical labs", () => {
  assert.equal(curriculum.length, 6);
  for (const phase of curriculum) {
    assert.ok(phase.answers[phase.correct]);
    assert.equal(phase.topics.length, 4);
    assert.ok(phase.topics.every((topic) => topic.lab.length > 20));
  }
});
test("PID model is finite, gain-sensitive, and integrates out static error", () => {
  const proportional = simulatePid(2, 0, 0);
  const integral = simulatePid(2, 2, 0.05);
  assert.ok(integral.every((point) => Number.isFinite(point.speed)));
  assert.ok(
    Math.abs(1 - integral.at(-1)!.speed) <
      Math.abs(1 - proportional.at(-1)!.speed),
  );
});
test("validator never throws on unexpected XML attribute structure", () => {
  for (const source of [
    '<robot name="r"><link/><joint type="revolute"><axis xyz="0"/></joint></robot>',
    '<robot name="r"><link name="base_footprint"><visual><geometry><box size="NaN 1 1"/></geometry></visual></link></robot>',
  ])
    assert.equal(validateUrdf(source).passed, false);
});
