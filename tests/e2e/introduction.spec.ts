import { test, expect } from "@playwright/test";

test("new learners understand the game before entering the garage", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "RoboQuest", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No payment. No account. Start with zero experience."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Start your journey" }).click();
  await expect(page).toHaveURL(/\/play/);
  await expect(
    page.getByRole("button", { name: "Build & validate" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Continue your journey" }),
  ).toBeVisible();
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name}: introduction has a visible robot and fits the viewport`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    await expect
      .poll(() =>
        canvas.evaluate((element) => {
          const target = element as HTMLCanvasElement;
          const context = target.getContext("webgl2")!;
          const pixels = new Uint8Array(target.width * target.height * 4);
          context.readPixels(
            0,
            0,
            target.width,
            target.height,
            context.RGBA,
            context.UNSIGNED_BYTE,
            pixels,
          );
          let count = 0;
          for (let index = 0; index < pixels.length; index += 4)
            if (pixels[index] > 100 && pixels[index + 1] > 120) count++;
          return count;
        }),
      )
      .toBeGreaterThan(200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("link", { name: "Start your journey" }),
    ).toBeInViewport();
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.name}-introduction.png`),
      fullPage: true,
    });
  });
}
