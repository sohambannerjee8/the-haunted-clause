// Lights on mode (haunted-house-ui R8, R19.1, R19.3).
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { analyze } from "../src/lib/analyzer/analyze";
import { ROOMS } from "../src/lib/analyzer/rooms";
import { mergeFindings } from "../src/lib/llm/merge";
import { SAMPLES } from "../src/lib/samples";
import { sampleReading } from "../src/lib/samples/explanations";
import { SAMPLE_META } from "../src/lib/samples/meta";
import { AXE_TAGS, expect, test } from "./fixtures";
import { waitForFades } from "./helpers";

async function axeClean(page: Page, label: string) {
  await waitForFades(page); // a half-faded text would be measured at partial opacity
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), label).toEqual([]);
}

for (const m of SAMPLE_META) {
  test(`${m.id}: Lights on lists the same findings as the house, with h2 and h3 headings, and passes axe`, async ({ page }) => {
    const s = SAMPLES.find((x) => x.id === m.id)!;
    const r = analyze(s.text);
    if (!r.ok) throw new Error("too long");
    const findings = mergeFindings(r.findings, sampleReading(m.id));
    const quoteOf = new Map(findings.map((f) => [f.id, f.quote]));

    await page.goto("/");
    await page.getByRole("button", { name: `Open this house: ${m.company}` }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
    await axeClean(page, "house");
    const house = await page.locator("button.hc-ghost").evaluateAll((els) => els.map((e) => [e.getAttribute("data-finding-id"), e.getAttribute("data-severity")]));

    const toggle = page.getByRole("button", { name: "Lights on" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toBeFocused(); // R8.5
    await expect(page.getByRole("heading", { level: 2, name: "Lights on" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toHaveCount(0);
    await expect(page.locator("main h3")).toHaveText(ROOMS.map((x) => x.name));
    await expect(page.locator("button.hc-ghost")).toHaveCount(0);
    await expect(page.locator("main svg")).toHaveCount(0);

    const items = page.locator("li[data-finding-id]");
    const list = await items.evaluateAll((els) =>
      els.map((e) => [e.getAttribute("data-finding-id"), e.getAttribute("data-severity"), e.querySelector("blockquote")!.textContent]),
    );
    expect(list.map(([id, sev]) => [id, sev])).toEqual(house);
    for (const [id, , quote] of list) expect(quote).toBe(quoteOf.get(id!));

    const quiet = ROOMS.filter((x) => !findings.some((f) => f.room === x.id));
    for (const q of quiet) await expect(page.getByRole("region", { name: q.name }).getByText("Quiet", { exact: true })).toBeVisible();

    await axeClean(page, "lights on");

    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toBeFocused();
    await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  });
}
