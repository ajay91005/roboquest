import assert from "node:assert/strict";
import test from "node:test";
import { referenceUrdf, starterUrdf } from "../src/lib/robot";
import { validateUrdf } from "../src/lib/validate-urdf";

test("reference robot passes all quest checks", () =>
  assert.equal(validateUrdf(referenceUrdf).passed, true));
test("rejects attribute spoofing, invisible models and disconnected moving chains", () => {
  for (const source of [
    referenceUrdf.replace(
      '<parent link="forearm"/>',
      "<parent><link>forearm</link></parent>",
    ),
    referenceUrdf.replace(/<visual>[\s\S]*?<\/visual>/g, ""),
    referenceUrdf.replace(
      'name="elbow_joint" type="revolute"',
      'name="elbow_joint" type="fixed"',
    ),
    referenceUrdf.replace('parent link="upper_arm"', 'parent link="base_link"'),
  ])
    assert.equal(validateUrdf(source).passed, false);
});
test("starter has exactly one actionable transform failure", () =>
  assert.deepEqual(
    validateUrdf(starterUrdf)
      .checks.filter((check) => !check.passed)
      .map((check) => check.id),
    ["tool"],
  ));
test("rejects malformed XML and entity declarations", () => {
  for (const source of [
    "<robot>",
    '<!DOCTYPE robot [<!ENTITY x SYSTEM "file:///etc/passwd">]><robot name="x"/>',
  ])
    assert.equal(validateUrdf(source).passed, false);
});
test("rejects missing parents, cycles and duplicate links", () => {
  for (const source of [
    referenceUrdf.replace('parent link="forearm"', 'parent link="missing"'),
    referenceUrdf.replace(
      'parent link="base_footprint"',
      'parent link="tool0"',
    ),
    referenceUrdf.replace("</robot>", '<link name="base_link"/></robot>'),
  ])
    assert.equal(validateUrdf(source).passed, false);
});
test("rejects zero axes, inverted limits and external meshes", () => {
  for (const source of [
    referenceUrdf.replace('axis xyz="0 1 0"', 'axis xyz="0 0 0"'),
    referenceUrdf.replace('lower="-1.2"', 'lower="2"'),
    referenceUrdf.replace(
      '<box size="0.62 0.44 0.16"/>',
      '<mesh filename="https://example.com/model.stl"/>',
    ),
  ])
    assert.equal(validateUrdf(source).passed, false);
});
