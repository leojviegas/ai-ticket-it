export default {
  testRunner: "jest",
  mutate: ["src/domain/entities/**/*.js"],
  reporters: ["clear-text", "progress", "html"],
  coverageAnalysis: "perTest",
  jest: {
    config: {
      testMatch: [
        "**/tests/domain/**/*.test.js",
        "**/tests/services/**/*.test.js",
      ],
    },
  },
};

