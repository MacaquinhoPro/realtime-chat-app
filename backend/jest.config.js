module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/src", "<rootDir>/tests"],

  moduleFileExtensions: ["ts", "js", "json"],

  testMatch: ["**/*.test.ts"],

  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  setupFilesAfterEnv: ["<rootDir>/tests/setup/db.mock.ts"],
};