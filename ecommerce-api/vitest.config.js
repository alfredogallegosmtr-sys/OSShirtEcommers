import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.js"],
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: "v8",
      all: true,
      reporter: ["text", "json-summary"],
      include: ["src/**/*.js"],
      exclude: ["src/seed/**", "src/config/db.config_practice.js"],
    },
  },
});
