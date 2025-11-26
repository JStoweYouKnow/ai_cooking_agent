import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@server": path.resolve(__dirname, "./server"),
      "@drizzle": path.resolve(__dirname, "./drizzle"),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // Include only test files in server and client directories
    include: [
      "server/**/*.test.ts",
      "client/**/*.test.ts",
    ],
    // Explicitly exclude e2e tests (they use Playwright, not Vitest)
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
    ],
  },
});
