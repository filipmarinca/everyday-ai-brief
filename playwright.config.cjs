const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium" },
  webServer: { command: "npm run preview", url: "http://127.0.0.1:4173", reuseExistingServer: false }
});
