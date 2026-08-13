import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "e2e/**/*.cy.ts",
    supportFile: "support/e2e.ts",
    fixturesFolder: "fixtures",
    screenshotsFolder: "screenshots",
    videosFolder: "videos",
    env: {
      API_URL: "http://localhost:3001",
    },
  },
});
