// The main flows (haunted-house-ui R1.6, R3, R15.2, R17.2, R17.4). Runs in the no-key project.
import type { Page, Request } from "@playwright/test";
import { analyze } from "../src/lib/analyzer/analyze";
import { ROOMS } from "../src/lib/analyzer/rooms";
import { hauntScore } from "../src/lib/analyzer/score";
import { mergeFindings } from "../src/lib/llm/merge";
import { SAMPLES } from "../src/lib/samples";
import { sampleReading } from "../src/lib/samples/explanations";
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

// --- Second part (Task 25.3): the house for each sample matches the analyzer. ---

/** design-language.md, "Ghost intensity levels", desktop sizes. */
const LEVELS = [
  { size: 28, opacity: "0.55", colour: "rgb(154, 147, 166)" },
  { size: 40, opacity: "0.75", colour: "rgb(242, 181, 68)" },
  { size: 52, opacity: "0.9", colour: "rgb(239, 138, 76)" },
  { size: 64, opacity: "1", colour: "rgb(166, 232, 107)" },
];

function expected(id: (typeof SAMPLES)[number]["id"]) {
  const s = SAMPLES.find((x) => x.id === id)!;
  const r = analyze(s.text);
  if (!r.ok) throw new Error("sample too long");
  const findings = mergeFindings(r.findings, sampleReading(id));
  return { sample: s, findings, score: hauntScore(findings) };
}

test.describe("the house matches the analyzer (R4, R5, R7, R15, R19.3)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  for (const m of SAMPLE_META) {
    test(`${m.id}: toolbar, headings, rooms, ghosts and score`, async ({ page }) => {
      const want = expected(m.id);
      await page.goto("/");
      await page.getByRole("button", { name: `Open this house: ${m.company}` }).click();

      await expect(page.getByText(`Sample: ${m.company} (a fictional company)`)).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();

      const rooms = page.locator("section[data-room]");
      await expect(rooms).toHaveCount(8);
      expect(await rooms.evaluateAll((els) => els.map((e) => e.getAttribute("data-room")))).toEqual(ROOMS.map((r) => r.id));
      for (const [i, room] of ROOMS.entries()) {
        const section = rooms.nth(i);
        await expect(section.getByRole("heading", { level: 3 })).toHaveText(room.name);
        const mine = want.findings.filter((f) => f.room === room.id);
        const buttons = section.locator("button.hc-ghost");
        await expect(buttons).toHaveCount(mine.length);
        expect(await buttons.evaluateAll((els) => els.map((e) => [e.getAttribute("data-finding-id"), e.getAttribute("data-severity")]))).toEqual(
          mine.map((f) => [f.id, String(f.severity)]),
        );
        const ghosts = mine.filter((f) => f.severity >= 1).length;
        const wisps = mine.length - ghosts;
        const status = section.locator("[data-room-status]");
        if (mine.length === 0) await expect(status).toHaveText("Quiet");
        if (ghosts) await expect(status).toContainText(`${ghosts} ${ghosts === 1 ? "ghost" : "ghosts"}`);
        if (wisps) await expect(status).toContainText(`${wisps} checked`);
      }

      await expect(page.getByTestId("haunt-score")).toHaveText(new RegExp(`^${want.score} · `));

      // One ghost of each level present: computed size, opacity and colour of its art (R5.4).
      for (const level of [0, 1, 2, 3]) {
        const art = page.locator(`button.hc-ghost[data-severity="${level}"] svg.hc-art`).first();
        if ((await page.locator(`button.hc-ghost[data-severity="${level}"]`).count()) === 0) continue;
        const got = await art.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { width: parseFloat(cs.width), height: parseFloat(cs.height), opacity: cs.opacity, colour: cs.color };
        });
        expect(got).toEqual({ width: LEVELS[level].size, height: LEVELS[level].size, opacity: LEVELS[level].opacity, colour: LEVELS[level].colour });
      }
    });
  }

  test("all four levels appear across the three samples", () => {
    const levels = new Set(SAMPLES.flatMap((s) => expected(s.id).findings.map((f) => f.severity)));
    expect([...levels].sort()).toEqual([0, 1, 2, 3]);
  });
});

// --- Task 26.2: clicking a ghost opens the panel with the exact quote and the right badge. ---
test.describe("the detail panel (R6.1, R6.2, R6.6, R15.1)", () => {
  for (const m of SAMPLE_META) {
    test(`${m.id}: one ghost per room opens with the exact quote and its badge; Escape closes it`, async ({ page }) => {
      const want = expected(m.id);
      await page.goto("/");
      await page.getByRole("button", { name: `Open this house: ${m.company}` }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
      // The first finding of each non-quiet room.
      const firsts = ROOMS.map((r) => want.findings.find((f) => f.room === r.id)).filter((f) => f !== undefined);
      expect(firsts.length).toBeGreaterThan(0);
      for (const f of firsts) {
        const ghost = page.locator(`button.hc-ghost[data-finding-id="${f.id}"]`);
        await ghost.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(ROOMS.find((r) => r.id === f.room)!.name);
        const quote = await dialog.locator("blockquote").evaluate((el) => el.textContent);
        expect(quote).toBe(want.sample.text.slice(f.start, f.end));
        expect(quote).toBe(f.quote);
        await expect(dialog.getByText(f.source === "llm" ? "Medium's reading" : "Rule reading", { exact: true })).toBeVisible();
        await expect(dialog.getByText(f.explanation, { exact: true })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(ghost).toBeFocused();
      }
    });
  }

  test("pasted text shows rule texts and Rule reading badges (llm-explainer R3.3)", async ({ page }) => {
    const r = analyze(PASTED);
    if (!r.ok) throw new Error("too long");
    expect(r.findings.length).toBeGreaterThan(0);
    await page.goto("/");
    await page.getByLabel("Paste a Terms & Conditions or privacy policy").fill(PASTED);
    await page.getByRole("button", { name: "Analyze" }).click();
    for (const f of r.findings) {
      await page.locator(`button.hc-ghost[data-finding-id="${f.id}"]`).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.locator("blockquote")).toHaveText(PASTED.slice(f.start, f.end));
      await expect(dialog.getByText(f.explanation, { exact: true })).toBeVisible();
      await expect(dialog.getByText(f.whyItMatters, { exact: true })).toBeVisible();
      await expect(dialog.getByText("Rule reading", { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Close" }).click();
      await expect(dialog).toBeHidden();
    }
  });
});
