// The main flows (haunted-house-ui R1.6, R3, R15.2, R17.2, R17.4). Runs in the no-key project.
import type { Page, Request } from "@playwright/test";
import { SAMPLE_META } from "../src/lib/samples/meta";
import { expect, test } from "./fixtures";

const PASTED =
  "Welcome to the Example Tea service. We may sell your personal information to data brokers. " +
  "Your subscription renews automatically each year. Thanks for reading.";

function recordRequests(page: Page) {
  const seen: Request[] = [];
  page.on("request", (r) => seen.push(r));
  return seen;
}
const explainCalls = (rs: Request[]) => rs.filter((r) => new URL(r.url()).pathname.startsWith("/api/explain"));

async function storageIsEmpty(page: Page) {
  const s = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
    idb: (await indexedDB.databases()).length,
  }));
  expect(s).toEqual({ local: 0, session: 0, cookie: "", idb: 0 });
}

test.describe("samples (R3.3, R15.2)", () => {
  for (const m of SAMPLE_META) {
    test(`opening ${m.id} shows the house view and makes no request to /api/explain`, async ({ page }) => {
      const requests = recordRequests(page);
      await page.goto("/");
      await page.getByRole("button", { name: `Open this house: ${m.company}` }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(explainCalls(requests)).toEqual([]);

      // Read another policy: back to the input screen, empty after a sample (R17.4).
      await page.getByRole("button", { name: "Read another policy" }).click();
      await expect(page.getByLabel("Paste a Terms & Conditions or privacy policy")).toHaveValue("");
      await storageIsEmpty(page);
    });
  }
});

test("pasted text is analyzed in the browser and no request carries it (R3.1, R3.2)", async ({ page }) => {
  const requests = recordRequests(page);
  await page.goto("/");
  await page.getByLabel("Paste a Terms & Conditions or privacy policy").fill(PASTED);
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(explainCalls(requests)).toEqual([]);
  const fragments = ["the Example Tea service", "data brokers", "renews automatically"];
  for (const r of requests) {
    const carried = `${decodeURIComponent(r.url())} ${r.postData() ?? ""}`;
    for (const f of fragments) expect(carried, r.url()).not.toContain(f);
  }

  // Read another policy keeps the pasted text (R17.4).
  await page.getByRole("button", { name: "Read another policy" }).click();
  await expect(page.getByLabel("Paste a Terms & Conditions or privacy policy")).toHaveValue(PASTED);
  await storageIsEmpty(page);
});

test("while the house chunk loads, 'Opening the house…' shows and main is aria-busy (R17.2)", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/_next/static/chunks/**", async (route) => {
    await gate;
    await route.continue();
  });
  await page.getByRole("button", { name: `Open this house: ${SAMPLE_META[2].company}` }).click();
  await expect(page.getByText("Opening the house…")).toBeVisible();
  await expect(page.locator("main#content")).toHaveAttribute("aria-busy", "true");
  release();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await expect(page.locator("main#content")).not.toHaveAttribute("aria-busy", "true");
});
