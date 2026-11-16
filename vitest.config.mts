import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // Tests are not React server code, so `server-only` resolves to its empty module here.
    // The browser bundle is still protected: `npm run check:bundle` and server-only.test.ts.
    alias: { "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) },
  },
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
        "src/lib/llm/**": { lines: 90 },
        // Everything else in src/.
        "!src/lib/{analyzer,llm}/**": { lines: 80 },
      },
    },
  },
});
