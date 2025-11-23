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
    projects: [
      {
        name: "server",
        test: {
          environment: "node",
          include: [
            "server/**/*.test.ts",
            "server/**/*.spec.ts",
          ],
        },
      },
      {
        name: "client",
        test: {
          environment: "jsdom",
          include: [
            "client/**/*.test.ts",
            "client/**/*.spec.ts",
          ],
        },
      },
    ],
  },
});
