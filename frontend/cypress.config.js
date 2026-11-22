const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:8081",
    viewportWidth: 390,
    viewportHeight: 844,
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 60000,
    requestTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    supportFile: "cypress/support/e2e.js",
  },
});
