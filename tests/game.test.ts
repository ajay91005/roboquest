import assert from "node:assert/strict";
import test from "node:test";
import {
  decisions,
  earnedXp,
  milestones,
  nextMission,
  phaseRequirement,
  phaseUnlocked,
  totalXp,
} from "../src/lib/game";
import { evaluatePid, simulatePid } from "../src/lib/control";
import { parseProgress } from "../src/lib/progress";

test("progression requires the practical build and every previous phase", () => {
  assert.equal(phaseUnlocked(1, ["urdf-tf2"]), false);
  assert.equal(phaseUnlocked(1, ["urdf-tf2", "mechanics"]), true);
  assert.equal(phaseUnlocked(5, ["integration"]), false);
  assert.ok(phaseRequirement("control", []));
  assert.equal(phaseRequirement("control", ["pid-lab"]), "");
});
test("XP ignores forged or repeated IDs and has a real completion total", () => {
  assert.equal(earnedXp(["urdf-tf2", "urdf-tf2", "fake"]), 250);
  assert.equal(earnedXp(milestones), totalXp);
  assert.deepEqual(
    parseProgress({ completed: ["fake", "mechanics"] }).completed,
    ["mechanics"],
  );
  assert.match(nextMission(milestones), /complete/);
});
test("every phase has three explained engineering decisions", () => {
  assert.equal(Object.keys(decisions).length, 6);
  for (const questions of Object.values(decisions))
    for (const question of questions) {
      assert.equal(questions.length, 3);
      assert.ok(question.options[question.answer]);
      assert.ok(question.explanation.length > 40);
    }
});
test("PID challenge is achievable and rejects no-control and proportional-only settings", () => {
  assert.equal(simulatePid(2, 2, 0.05)[0].speed, 0);
  assert.equal(evaluatePid(2, 2, 0.05).passed, true);
  assert.equal(evaluatePid(0, 0, 0).passed, false);
  assert.equal(evaluatePid(2, 0, 0).passed, false);
});
