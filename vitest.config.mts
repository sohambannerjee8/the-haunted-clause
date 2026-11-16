import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,mts}"],
    exclude: ["node_modules", ".next", "e2e"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.test-util.ts", "src/**/*.d.ts"],
      reporter: ["text", "json-summary", "html"],
      // Line coverage targets from .kiro/steering/testing.md.
      thresholds: {
        "src/lib/analyzer/**": { lines: 90 },
        // Everything else in src/ (the llm/ target is added with Phase 3's first llm file).
        "!src/lib/{analyzer,llm}/**": { lines: 80 },
      },
    },
  },
});
