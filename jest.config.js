module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Mappa gli alias TypeScript a percorsi reali
    "^uuid$": "<rootDir>/__tests__/mocks/uuid.ts",
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json", // Usa lo stesso tsconfig della build
    },
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/__tests__/**/*.test.ts"],
};
