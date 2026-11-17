// The first screen on a slow connection (haunted-house-ui R17.1, R18; tech.md "Performance budget").
// Chromium CDP throttling: 150 ms latency, 200,000 B/s down (1.6 Mbps), 93,750 B/s up (750 kbps), no cache.
import type { CDPSession, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { BOX } from "./helpers";

const BUDGET = 200 * 1024; // 200 kB of gzip-encoded JavaScript

interface Loaded {
  url: string;
  type: string;
  bytes: number;
}

async function throttle(page: Page): Promise<{ cdp: CDPSession; loaded: Loaded[] }> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 });
  const meta = new Map<string, { url: string; type: string }>();
  const loaded: Loaded[] = [];
  cdp.on("Network.responseReceived", (e) => meta.set(e.requestId, { url: e.response.url, type: e.type }));
  cdp.on("Network.loadingFinished", (e) => {
    const m = meta.get(e.requestId);
    if (m) loaded.push({ ...m, bytes: e.encodedDataLength });
  });
  return { cdp, loaded };
}

test.describe("on a slow connection (R18)", () => {
  test.setTimeout(90_000);

  test("the textarea accepts typing within 5 s, and first-load JS is within 200 kB (R18.1, R18.2)", async ({ page }, info) => {
    const { loaded } = await throttle(page);
    const started = Date.now();
    await page.goto("/", { waitUntil: "commit" });
    const box = page.getByLabel(BOX);
    // "Accepts typing" means the app reacts, not just the raw HTML box: keep typing until the
    // hydrated counter follows the text, all within 5 s of navigation start.
    await box.click({ timeout: 5_000 });
    while (Date.now() - started < 5_000) {
      await box.pressSequentially("k");
      const value = await box.inputValue();
      const counter = await page.getByText(/ \/ 50,000 characters$/).textContent().catch(() => "");
      if (value.length > 0 && counter === `${value.length} / 50,000 characters`) break;
      await page.waitForTimeout(50);
    }
    const usableMs = Date.now() - started;
    const value = await box.inputValue();
    await expect(page.getByText(`${value.length} / 50,000 characters`)).toBeVisible({ timeout: 100 });
    expect(value.length).toBeGreaterThan(0);
    expect(usableMs).toBeLessThanOrEqual(5_000);

    await page.waitForLoadState("networkidle");
    const scripts = loaded.filter((l) => l.type === "Script");
    const jsBytes = scripts.reduce((n, l) => n + l.bytes, 0);
    const line = `perf: textarea usable after ${usableMs} ms; first-load JS ${jsBytes} B gzip-encoded in ${scripts.length} files (budget ${BUDGET} B)`;
    console.log(line);
    info.annotations.push({ type: "perf", description: line });
    expect(scripts.length).toBeGreaterThan(0);
    expect(jsBytes).toBeLessThanOrEqual(BUDGET);
  });

  test("no request loads the house view before the first Analyze or sample click (R17.1)", async ({ page }) => {
    const { loaded } = await throttle(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const before = new Set(loaded.filter((l) => l.type === "Script").map((l) => l.url));
    const count = loaded.length;

    await page.getByRole("button", { name: /^Open this house: Murkwillow/ }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible({ timeout: 30_000 });
    const after = loaded.slice(count).filter((l) => l.type === "Script").map((l) => l.url);
    // The house view, the analyzer and the sample texts arrive only now, in chunks the first load never fetched.
    expect(after.length).toBeGreaterThan(0);
    for (const url of after) expect(before.has(url), url).toBe(false);
  });
});
