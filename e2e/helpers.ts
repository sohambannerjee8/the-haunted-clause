// Shared E2E helpers for reaching each app state (haunted-house-ui R12.1, R19.1).
import type { Page } from "@playwright/test";
import { analyze } from "../src/lib/analyzer/analyze";
import { SAMPLE_META } from "../src/lib/samples/meta";
import { expect } from "./fixtures";

export const BOX = "Paste a Terms & Conditions or privacy policy";
export const RISKY = "Welcome to the Example Tea service. We may sell your personal information to data brokers. Your subscription renews automatically each year.";
export const SPANISH =
  "Bienvenido a nuestro servicio. Podemos compartir sus datos con nuestros socios para mejorar la experiencia. " +
  "Su suscripción se renueva cada año y puede cancelarla cuando quiera desde la configuración de su cuenta.";
export const NO_RISK = "Thanks for reading our policy. We hope you enjoy the app and have a lovely day.";
export const ONLY_WISPS = "We do not sell your personal information.";

// Guard the fixtures themselves, so a rule change cannot silently empty a state.
const ok = (t: string) => {
  const r = analyze(t);
  if (!r.ok) throw new Error("too long");
  return r;
};
if (ok(NO_RISK).findings.length !== 0) throw new Error("NO_RISK fixture has findings");
if (!ok(ONLY_WISPS).findings.length || ok(ONLY_WISPS).findings.some((f) => f.severity > 0)) throw new Error("ONLY_WISPS fixture is not wisps only");
if (!ok(SPANISH).likelyNonEnglish) throw new Error("SPANISH fixture is not flagged");
if (ok(RISKY).findings.length === 0) throw new Error("RISKY fixture has no findings");

/** Wait until every one-off animation (the 200 ms fades) has finished; repeating ghost motion is ignored. */
export async function waitForFades(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running" || !Number.isFinite(a.effect?.getComputedTiming().iterations ?? 1)),
  );
}

export async function analyzeText(page: Page, text: string) {
  await page.goto("/");
  await page.getByLabel(BOX).fill(text);
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await waitForFades(page);
}

export async function openSample(page: Page, id: "mild" | "average" | "terrible") {
  const m = SAMPLE_META.find((x) => x.id === id)!;
  await page.goto("/");
  await page.getByRole("button", { name: `Open this house: ${m.company}` }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await waitForFades(page);
}

/** Paste through a real paste event, so the app's cap logic runs. */
export async function paste(page: Page, text: string) {
  await page.getByLabel(BOX).evaluate((el, t) => {
    const dt = new DataTransfer();
    dt.setData("text/plain", t);
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  }, text);
}

/** Hold back every new JS chunk until the returned function is called. */
export async function holdChunks(page: Page): Promise<() => void> {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/_next/static/chunks/**", async (route) => {
    await gate;
    await route.continue();
  });
  return release;
}

export async function blockChunks(page: Page) {
  await page.route("**/_next/static/chunks/**", (route) => route.abort("failed"));
}
