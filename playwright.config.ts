import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:8791",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run db:local && npm run build && npm run dev",
        url: "http://127.0.0.1:8791/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
