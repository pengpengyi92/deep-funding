import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/database-e2e",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.DATABASE_BASE_URL || "http://127.0.0.1:8793",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.DATABASE_BASE_URL
    ? undefined
    : {
        command: `"${process.env.PYTHON_BIN || "python"}" scripts/serve_database.py --port 8793`,
        url: "http://127.0.0.1:8793/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
