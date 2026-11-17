import { defineConfig, devices } from "@playwright/test";

// Two production servers (haunted-house-ui design, "E2E setup"):
// - no-key (3100): every flow, with no LLM key.
// - llm-ui (3101): built with a placeholder key so llmAvailable is true and the opt-in UI shows.
//   The build never calls Google (C10.14). Its `next start` sends all outbound HTTP(S) to a dead
//   local proxy, so even an unstubbed request cannot reach Google (PLAN_DECISIONS.md C10.18).
//   Tests for this project carry "@llm-ui" in their title; "@both" tests run in both projects.
const NO_KEY_PORT = Number(process.env.E2E_PORT ?? 3100);
const LLM_PORT = Number(process.env.E2E_LLM_PORT ?? 3101);
const PLACEHOLDER_KEY = "placeholder-e2e-not-a-real-key";
const DEAD_PROXY = {
  NODE_USE_ENV_PROXY: "1",
  HTTPS_PROXY: "http://127.0.0.1:9",
  HTTP_PROXY: "http://127.0.0.1:9",
  https_proxy: "http://127.0.0.1:9",
  http_proxy: "http://127.0.0.1:9",
  NO_PROXY: "localhost,127.0.0.1",
  no_proxy: "localhost,127.0.0.1",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { trace: "retain-on-failure" },
  projects: [
    {
      name: "no-key",
      grepInvert: /@llm-ui/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${NO_KEY_PORT}` },
    },
    {
      name: "llm-ui",
      grep: /@llm-ui|@both/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${LLM_PORT}` },
    },
  ],
  webServer: [
    {
      // E2E runs against a production build with no LLM key.
      command: `npm run build && npx next start -p ${NO_KEY_PORT}`,
      url: `http://localhost:${NO_KEY_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: { GEMINI_API_KEY: "" },
    },
    {
      command: `npx next build && npx next start -p ${LLM_PORT}`,
      url: `http://localhost:${LLM_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: { HC_DIST_DIR: ".next-e2e-llm", GEMINI_API_KEY: PLACEHOLDER_KEY, ...DEAD_PROXY },
    },
  ],
});
