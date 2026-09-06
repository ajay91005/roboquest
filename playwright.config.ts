import { defineConfig } from "@playwright/test";

const production = process.env.TEST_PRODUCTION === "1";
const port = production ? 3001 : 3000;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    launchOptions: {
      args: [
        "--use-angle=swiftshader",
        "--enable-webgl",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: {
    command: production ? "npx serve out -l 3001" : "npm run dev -- --port 3000",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
