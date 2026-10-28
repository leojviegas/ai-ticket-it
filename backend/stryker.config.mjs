export default {
  testRunner: "jest",
  mutate: ["src/domain/entities/**/*.js"],
  reporters: ["clear-text", "progress", "html"],
  coverageAnalysis: "perTest"
};

