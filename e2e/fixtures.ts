// Shared Playwright fixtures. `test` from here adds an automatic browser guard: any request from
// the page to a host other than localhost fails the test (PLAN_DECISIONS.md C10.18).
import { expect, test as base } from "@playwright/test";

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const LOCAL = new Set(["localhost", "127.0.0.1"]);

export const test = base.extend<{ browserGuard: void }>({
  browserGuard: [
    async ({ page }, use) => {
      const foreign: string[] = [];
      page.on("request", (r) => {
        const url = new URL(r.url());
        if (url.protocol === "data:" || url.protocol === "blob:" || url.protocol === "about:") return;
        if (!LOCAL.has(url.hostname)) foreign.push(r.url());
      });
      await use();
      expect(foreign, "requests left the browser for another host").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
