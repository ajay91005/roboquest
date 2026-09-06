import { test, expect } from "@playwright/test";

test("URDF quest, mentor, XP, saving and editor tabs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/play");
  await page.waitForFunction(
    () => window.roboMonaco?.editor.getModels().length,
  );
  await page.getByRole("button", { name: "Build & validate" }).click();
  await expect(page.locator(".console-error")).toHaveCount(1);
  await expect(page.locator(".console-error")).toContainText(
    "forearm to tool0",
  );
  await page.getByRole("button", { name: "Give me a hint" }).click();
  await expect(page.locator(".mentor-messages")).toContainText(
    "Inspect the parent",
  );
  await page.getByRole("button", { name: "Give me a hint" }).click();
  await expect(page.locator(".mentor-messages")).toContainText(
    "bypasses both arm joints",
  );
  await page.getByRole("button", { name: "Give me a hint" }).click();
  await expect(page.locator(".mentor-messages")).toContainText(
    '<parent link="forearm"/>',
  );
  await page.evaluate(() => {
    const model = window
      .roboMonaco!.editor.getModels()
      .find((candidate) => candidate.uri.path.endsWith("rover.urdf"))!;
    model.setValue(
      model
        .getValue()
        .replace(
          '<parent link="base_link"/><child link="tool0"/>',
          '<parent link="forearm"/><child link="tool0"/>',
        ),
    );
  });
  await page.getByRole("button", { name: "Build & validate" }).click();
  await expect(page.locator(".console-error")).toHaveCount(0);
  await expect(page.locator(".console-success")).toHaveCount(7);
  await expect(page.locator(".xp-caption")).toContainText("250 XP");
  await page
    .getByRole("dialog", { name: "Rover's arm is connected" })
    .getByRole("button", { name: "Close dialog" })
    .click();
  await page.getByRole("button", { name: "Build & validate" }).click();
  await expect(page.locator(".xp-caption")).toContainText("250 XP");
  await page.reload();
  await expect(page.locator(".xp-caption")).toContainText("250 XP");
  await page.getByRole("tab", { name: "node.py", exact: true }).click();
  await page.getByRole("button", { name: "Build & validate" }).click();
  await expect(page.locator(".toast")).toContainText(
    "Execute them in the documented native ROS workspace",
  );
  await page.getByRole("button", { name: "Tech tree", exact: true }).click();
  await expect(
    page.locator(".phase-row").nth(1).getByRole("button", { name: "Locked" }),
  ).toBeDisabled();
  await expect(
    page.locator(".phase-row").nth(2).getByRole("button", { name: "Locked" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name}: nonblank animated robot and no horizontal overflow`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    const canvas = page.locator(".robot-canvas canvas");
    await expect(canvas).toBeVisible();
    await page.waitForFunction(
      () => window.roboMonaco?.editor.getModels().length,
    );
    await expect
      .poll(() =>
        canvas.evaluate((element) => {
          const canvas = element as HTMLCanvasElement;
          const gl = canvas.getContext("webgl2")!;
          const pixels = new Uint8Array(canvas.width * canvas.height * 4);
          gl.readPixels(
            0,
            0,
            canvas.width,
            canvas.height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels,
          );
          let bright = 0;
          for (let index = 0; index < pixels.length; index += 4)
            if (pixels[index] > 100 && pixels[index + 1] > 120) bright++;
          return bright;
        }),
      )
      .toBeGreaterThan(200);
    const before = await canvas.evaluate((element) =>
      (element as HTMLCanvasElement).toDataURL(),
    );
    await page
      .getByRole("button", { name: "Animate joints", exact: true })
      .click();
    await expect
      .poll(() =>
        canvas.evaluate((element) =>
          (element as HTMLCanvasElement).toDataURL(),
        ),
      )
      .not.toBe(before);
    await page
      .getByRole("button", { name: "Pause joint animation", exact: true })
      .click();
    await page.getByRole("checkbox", { name: "TF frames" }).check();
    await expect(
      page.getByRole("checkbox", { name: "TF frames" }),
    ).toBeChecked();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.name}.png`),
      fullPage: true,
    });
    await canvas.screenshot({
      path: testInfo.outputPath(`${viewport.name}-robot.png`),
    });
    await page
      .getByRole("button", { name: "Control lab", exact: true })
      .click();
    const plot = page.locator(".pid-plot path");
    const original = await plot.getAttribute("d");
    await page.getByRole("slider", { name: "kp gain" }).fill("4");
    await expect(plot).not.toHaveAttribute("d", original!);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
