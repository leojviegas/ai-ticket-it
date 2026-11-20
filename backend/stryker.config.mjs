export default {
  testRunner: "jest",
  mutate: ["src/domain/entities/**/*.js"],
  reporters: ["clear-text", "progress", "html"],
  coverageAnalysis: "perTest",
  jest: {
    config: {
      testMatch: [
        "<rootDir>/tests/domain/**/*.test.js",
        "<rootDir>/tests/services/**/*.test.js",
      ],
    },
  },
};

