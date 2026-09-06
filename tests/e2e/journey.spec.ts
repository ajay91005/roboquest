import { test, expect } from "@playwright/test";
import { curriculum } from "../../src/lib/curriculum";
import { decisions } from "../../src/lib/game";
import { initialProgress, STORAGE_KEY } from "../../src/lib/progress";
import { referenceUrdf } from "../../src/lib/robot";

test("complete all eight milestones, recover from mistakes, and resume at 1000 XP", async ({
  page,
}) => {
  await page.goto("/play");
  await page.waitForFunction(
    () => window.roboMonaco?.editor.getModels().length,
  );
  await page.evaluate(
    (source) =>
      window
        .roboMonaco!.editor.getModels()
        .find((model) => model.uri.path.endsWith("rover.urdf"))!
        .setValue(source),
    referenceUrdf,
  );
  await page.getByRole("button", { name: "Build & validate" }).click();
  await page
    .getByRole("dialog")
    .filter({ hasText: "Every link in the right place." })
    .getByRole("button", { name: "Close dialog" })
    .click();
  await page.getByRole("button", { name: "Control lab", exact: true }).click();
  await page.getByRole("slider", { name: "ki gain" }).fill("0");
  await page.getByRole("button", { name: "Test controller" }).click();
  await expect(page.locator(".toast")).toContainText("Not there yet");
  await page.getByRole("slider", { name: "ki gain" }).fill("2");
  await page.getByRole("button", { name: "Test controller" }).click();
  await expect(page.locator(".xp-caption")).toContainText("400 XP");
  await page.getByRole("button", { name: "Tech tree", exact: true }).click();
  await page
    .locator(".phase-row")
    .first()
    .getByRole("button", { name: "Open phase" })
    .click();
  for (const phase of curriculum) {
    const dialog = page.getByRole("dialog", { name: phase.title, exact: true });
    for (let topic = 0; topic < 4; topic++)
      await dialog
        .getByRole("button", {
          name: topic === 3 ? "Try the decisions" : "Continue",
          exact: true,
        })
        .click();
    const questions = [
      ...decisions[phase.id],
      {
        question: phase.question,
        options: phase.answers,
        answer: phase.correct,
      },
    ];
    for (const [index, question] of questions.entries()) {
      if (index === 0) {
        await dialog
          .getByRole("radio")
          .nth((question.answer + 1) % question.options.length)
          .check();
        await dialog.getByRole("button", { name: "Check answer" }).click();
        await expect(dialog.getByRole("status")).toContainText("Not quite");
        await expect(
          dialog.getByRole("button", { name: "Continue", exact: true }),
        ).toBeDisabled();
      }
      await dialog.getByRole("radio").nth(question.answer).check();
      await dialog.getByRole("button", { name: "Check answer" }).click();
      if (index < 3)
        await dialog
          .getByRole("button", { name: "Continue", exact: true })
          .click();
    }
    await dialog
      .getByRole("button", { name: "Complete mission", exact: true })
      .click();
    await expect(dialog).toContainText("MISSION COMPLETE");
    await dialog
      .getByRole("button", {
        name: phase.id === "autonomy" ? "See your journey" : "Next mission",
      })
      .click();
  }
  await expect(page.locator(".xp-caption")).toContainText("1000 XP");
  await page.reload();
  await expect(page.locator(".project-progress")).toContainText("100%");
  await expect(page.locator(".next-mission-banner")).toContainText(
    "foundation journey is complete",
  );
});

test("portable saves require confirmation and preserve the imported journey", async ({
  page,
}) => {
  await page.goto("/play");
  await page
    .getByRole("button", { name: "Journey backup", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Your journey, saved" });
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Export journey" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "roboquest-save.json",
  );
  const snapshot = {
    ...initialProgress,
    completed: ["urdf-tf2", "mechanics"],
    snippets: { ...initialProgress.snippets, urdf: referenceUrdf },
  };
  await dialog
    .locator("input[type=file]")
    .setInputFiles({
      name: "roboquest-save.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(snapshot)),
    });
  await expect(dialog).toContainText("350 XP");
  await expect(page.locator(".xp-caption")).toContainText("0 XP");
  await dialog
    .getByRole("button", { name: "Restore journey", exact: true })
    .click();
  await expect(page.locator(".xp-caption")).toContainText("350 XP");
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).completed,
        STORAGE_KEY,
      ),
    )
    .toEqual(snapshot.completed);
  await page.reload();
  await expect(page.locator(".xp-caption")).toContainText("350 XP");
});
