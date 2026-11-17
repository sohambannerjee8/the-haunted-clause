// Records the demo walkthrough in docs/VIDEO_SCRIPT.md against the live site (PLAN_DECISIONS.md C20).
//
// - Chromium through Playwright, 1440 x 900, motion on (no reduced-motion emulation), no sound.
// - The narration is burned in as captions: the script adds a caption bar to the page, so the captions
//   are part of the recorded pixels and need no subtitle filter.
// - Segment 6 ("How it was built with Kiro") cannot record the Kiro IDE from a browser, so it shows a
//   local page built at record time from the repository's real .kiro/ files, gate reports and a property test.
// - Output goes to video/ (git-ignored): demo.webm always; demo.mp4 too when a full ffmpeg is on PATH.
//   Never presses "Ask the medium", so the recording makes no Gemini call.
//
// Run: npx tsx scripts/record-demo.mts [--url https://the-haunted-clause.vercel.app]
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_TOTAL_SECONDS = 170; // the hackathon rule is under 3 minutes; the plan's limit is 2:50
export const MAX_CAPTION_CHARS = 90;
export const MIN_CAPTION_SECONDS = 1.5;
export const VIEWPORT = { width: 1440, height: 900 } as const;

export interface Segment {
  readonly start: number;
  readonly end: number;
  readonly title: string;
  readonly narration: string;
}

const toSec = (m: string, s: string) => Number(m) * 60 + Number(s);

/** The timed segments of docs/VIDEO_SCRIPT.md: "### m:ss–m:ss · Title" headings and their **Narration:** line. */
export function parseScript(md: string): Segment[] {
  const parts = md.split(/^### /m).slice(1);
  const segments: Segment[] = [];
  for (const p of parts) {
    const h = p.match(/^(\d):(\d\d)–(\d):(\d\d) · (.+)$/m);
    const n = p.match(/^\*\*Narration:\*\* "(.+)"\s*$/m);
    if (!h || !n) continue;
    segments.push({ start: toSec(h[1], h[2]), end: toSec(h[3], h[4]), title: h[5].trim(), narration: n[1].trim() });
  }
  if (segments.length === 0) throw new Error("no timed segments with narration found");
  return segments;
}

export interface Cue {
  readonly at: number;
  readonly until: number;
  readonly text: string;
}

/** Splits a segment's narration into captions of at most 90 characters, timed in proportion to their length. */
export function captionCues(seg: Segment, max = MAX_CAPTION_CHARS): Cue[] {
  const sentences = seg.narration.match(/[^.!?]+[.!?]+["”]?|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const pieces: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) {
      pieces.push(s);
      continue;
    }
    // Split a long sentence into lines of similar length, so no line is a short leftover.
    const words = s.split(" ");
    let lines = Math.ceil(s.length / max);
    for (;;) {
      const target = s.length / lines;
      const out: string[] = [];
      let line = "";
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (line && (next.length > max || (next.length > target && out.length < lines - 1))) {
          out.push(line);
          line = w;
        } else line = next;
      }
      if (line) out.push(line);
      if (out.every((l) => l.length <= max)) {
        pieces.push(...out);
        break;
      }
      lines += 1;
    }
  }
  const lines: string[] = [];
  for (const p of pieces) {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${p}`.length <= max) lines[lines.length - 1] = `${last} ${p}`;
    else lines.push(p);
  }
  const total = lines.reduce((a, l) => a + l.length, 0);
  const span = seg.end - seg.start;
  // Every caption gets at least MIN_CAPTION_SECONDS (when the segment allows it); the rest goes by length.
  const floor = Math.min(MIN_CAPTION_SECONDS, span / lines.length);
  const spare = span - floor * lines.length;
  let at = seg.start;
  return lines.map((text, i) => {
    const until = i === lines.length - 1 ? seg.end : at + floor + (spare * text.length) / total;
    const cue = { at, until, text };
    at = until;
    return cue;
  });
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface KiroPageInput {
  readonly files: readonly string[];
  readonly ears: readonly string[];
  readonly reports: readonly string[];
  readonly propertyLine: string;
}

/** A plain local page listing the real .kiro/ files, a few EARS lines, the gate reports and a property test line. */
export function kiroPageHtml(input: KiroPageInput): string {
  const groups = new Map<string, string[]>();
  for (const f of input.files) {
    const parts = f.split("/");
    const dir = parts.length > 2 ? `${parts.slice(0, 3).join("/")}/` : `${parts[0]}/`;
    const dirKey = parts.length > 3 ? dir : `${parts.slice(0, 2).join("/")}/`;
    const list = groups.get(dirKey) ?? [];
    list.push(f.slice(dirKey.length));
    groups.set(dirKey, list);
  }
  const section = (id: string, title: string, body: string) =>
    `<section id="${id}"><h2>${esc(title)}</h2>${body}</section>`;
  const tree = [...groups.entries()]
    .map(([dir, files]) => `<div class="dir"><div class="name">${esc(dir)}</div><ul>${files.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>`)
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>.kiro/ in the repository</title><style>
body{margin:0;background:#0d0a10;color:#efe6d8;font:18px/1.5 ui-monospace,Menlo,monospace;padding:40px 64px 160px}
h1{font:600 30px/1.2 system-ui,sans-serif;margin:0 0 8px}p.sub{color:#b9a9c2;margin:0 0 24px}
h2{font:600 22px/1.3 system-ui,sans-serif;color:#f2b544;margin:28px 0 10px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.dir{background:#1e1024;border:2px solid #6b4a7d;border-radius:8px;padding:10px 14px}
.dir .name{color:#a6e86b;font-weight:700}ul{margin:4px 0 0;padding-left:20px}li{color:#efe6d8}
pre{background:#1e1024;border:2px solid #6b4a7d;border-radius:8px;padding:12px 16px;white-space:pre-wrap;margin:0}
</style></head><body><h1>.kiro/ in this repository</h1><p class="sub">Real files from the project, listed at recording time.</p>
${section("tree", "Specs, steering, hooks and agents", `<div class="grid">${tree}</div>`)}
${section("ears", "EARS requirements (clause-analyzer)", `<pre>${input.ears.map(esc).join("\n")}</pre>`)}
${section("reports", "Gate reports (docs/gate-reports/)", `<pre>${input.reports.map(esc).join("\n")}</pre>`)}
${section("property", "A property test at 1,000 runs", `<pre>${esc(input.propertyLine)}</pre>`)}
</body></html>`;
}

/* ------------------------------------------------------------------ recording ------------------------------------------------------------------ */

// Added to every page: a caption bar, a key indicator, an end card and a pointer dot. Each is a manual
// popover, so it sits in the top layer above a modal dialog and its backdrop; each ignores the pointer.
const OVERLAY = `(() => {
  const BASE = "position:fixed;inset:auto;margin:0;border:0;pointer-events:none;overflow:visible;";
  const STYLES = {
    __demo_cap: "left:50%;bottom:28px;transform:translateX(-50%);max-width:1100px;padding:10px 22px;border-radius:10px;background:rgba(13,10,16,.9);color:#efe6d8;font:600 26px/1.35 system-ui,sans-serif;text-align:center;",
    __demo_key: "right:28px;top:28px;padding:8px 16px;border-radius:8px;border:2px solid #f2b544;background:rgba(13,10,16,.92);color:#f2b544;font:700 24px/1.2 ui-monospace,Menlo,monospace;",
    __demo_card: "left:0;right:0;top:0;width:100%;box-sizing:border-box;padding:18px;background:rgba(13,10,16,.94);color:#efe6d8;font:700 30px/1.3 system-ui,sans-serif;text-align:center;",
    __demo_ptr: "left:0;top:0;width:22px;height:22px;border-radius:50%;background:rgba(239,230,216,.85);box-shadow:0 0 0 3px rgba(13,10,16,.7);transform:translate(-50%,-50%);padding:0;",
  };
  const el = (id) => {
    let e = document.getElementById(id);
    if (!e && document.body) {
      e = document.createElement("div");
      e.id = id;
      e.setAttribute("aria-hidden", "true");
      e.setAttribute("popover", "manual");
      e.style.cssText = BASE + STYLES[id];
      document.body.append(e);
    }
    return e;
  };
  // Re-showing moves a popover to the top of the top layer, above a dialog opened after it.
  const raise = (e) => { if (e.matches(":popover-open")) e.hidePopover(); e.showPopover(); };
  const show = (id, text) => {
    const e = el(id); if (!e) return;
    e.textContent = text || "";
    if (text) raise(e); else if (e.matches(":popover-open")) e.hidePopover();
  };
  window.__cap = (t) => show("__demo_cap", t);
  window.__key = (t) => show("__demo_key", t);
  window.__card = (t) => show("__demo_card", t);
  window.__raise = () => { for (const id of ["__demo_ptr", "__demo_cap", "__demo_key", "__demo_card"]) { const e = document.getElementById(id); if (e && e.matches(":popover-open")) raise(e); } };
  window.__ptr = (x, y) => { const e = el("__demo_ptr"); if (!e) return; e.style.left = x + "px"; e.style.top = y + "px"; if (!e.matches(":popover-open")) e.showPopover(); };
  document.addEventListener("mousemove", (ev) => window.__ptr(ev.clientX, ev.clientY), true);
  new MutationObserver(() => { if (document.querySelector("dialog[open]")) window.__raise(); })
    .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["open"] });
})();`;

function gitLines(args: string[]): string[] {
  const r = spawnSync("git", args, { encoding: "utf8" });
  return r.stdout.split("\n").filter(Boolean);
}

function hasFullFfmpeg(): boolean {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8" });
  return r.status === 0 && /libx264|h264_videotoolbox/.test(r.stdout);
}

async function main(): Promise<void> {
  const url = (process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : "https://the-haunted-clause.vercel.app").replace(/\/$/, "");
  const root = process.cwd();
  const outDir = join(root, "video");
  const rawDir = join(outDir, "raw");
  rmSync(rawDir, { recursive: true, force: true });
  mkdirSync(rawDir, { recursive: true });

  const segments = parseScript(readFileSync(join(root, "docs/VIDEO_SCRIPT.md"), "utf8"));
  const total = segments.at(-1)!.end;
  if (total > MAX_TOTAL_SECONDS) throw new Error(`script runs ${total} s, over ${MAX_TOTAL_SECONDS} s`);
  const cues = segments.flatMap((s) => captionCues(s));

  // The local page for segment 6, built from real repository files.
  const ears = readFileSync(join(root, ".kiro/specs/clause-analyzer/requirements.md"), "utf8")
    .split("\n").filter((l) => /\bWHEN\b.*\bSHALL\b/.test(l)).slice(0, 5).map((l) => l.replace(/^\s*\d+\.\s*/, ""));
  const propertyLine = readFileSync(join(root, "src/lib/analyzer/analyze.property.test.ts"), "utf8")
    .split("\n").find((l) => l.includes("numRuns: 1000"))?.trim() ?? "";
  const kiroFile = join(outDir, "kiro.html");
  writeFileSync(kiroFile, kiroPageHtml({
    files: gitLines(["ls-files", ".kiro"]),
    ears,
    reports: readdirSync(join(root, "docs/gate-reports")).filter((f) => f.endsWith(".md")).sort(),
    propertyLine,
  }));

  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const contextStart = Date.now();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    recordVideo: { dir: rawDir, size: VIEWPORT },
  });
  await context.addInitScript(OVERLAY);
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);

  // What the overlay shows now, so it can be put back after a page load.
  const shown = { cap: "", card: "" };
  const open = async (target: string) => {
    await page.goto(target, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate((st) => {
      const w = window as unknown as { __cap(t: string): void; __card(t: string): void };
      w.__cap(st.cap);
      w.__card(st.card);
    }, shown).catch(() => undefined);
  };
  await open(url);
  await page.waitForTimeout(800);

  // 0:00 starts now. Captions run on their own clock while the actions play.
  const t0 = Date.now();
  const offsetSeconds = (t0 - contextStart) / 1000;
  const elapsed = () => (Date.now() - t0) / 1000;
  const until = async (s: number) => { const wait = s * 1000 - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait); };
  let captionsDone = false;
  const captionLoop = (async () => {
    for (const c of cues) {
      while (elapsed() < c.at && !captionsDone) await new Promise((r) => setTimeout(r, 50));
      if (captionsDone) return;
      shown.cap = c.text;
      await page.evaluate((t) => (window as unknown as { __cap(t: string): void }).__cap(t), c.text).catch(() => undefined);
    }
  })();
  const key = (k: string) => page.evaluate((t) => (window as unknown as { __key(t: string): void }).__key(t), k).catch(() => undefined);
  const card = (t: string) => {
    shown.card = t;
    return page.evaluate((x) => (window as unknown as { __card(t: string): void }).__card(x), t).catch(() => undefined);
  };
  const press = async (k: string, label = k) => { await key(label); await page.keyboard.press(k); await page.waitForTimeout(650); };
  const hoverSmooth = async (selector: string) => {
    const box = await page.locator(selector).first().boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
  };
  const actual: string[] = [];
  const checks: string[] = [];
  const mark = (i: number) => actual.push(`${segments[i].title}: planned ${segments[i].start} s, started ${elapsed().toFixed(1)} s`);

  // 1. Cold open: the terrible house.
  mark(0);
  await page.getByRole("region", { name: "Or open a sample house" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Open this house: Murkwillow Social" }).click();
  await page.getByText("Inside the house").waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await until(segments[0].end);

  // 2. What the house is telling you: across the eight rooms, then a level 3 and a level 1 ghost.
  mark(1);
  for (const id of ["cellar", "portraits", "vault", "locked-door", "court", "mirror", "trapdoor", "stairs"]) {
    await page.locator(`section[data-room="${id}"]`).scrollIntoViewIfNeeded();
    await hoverSmooth(`section[data-room="${id}"]`);
    await page.waitForTimeout(900);
  }
  await page.locator('button[aria-label^="Severity 3 ghost"]').first().scrollIntoViewIfNeeded();
  await hoverSmooth('button[aria-label^="Severity 3 ghost"]');
  await page.waitForTimeout(2000);
  await page.locator('button[aria-label^="Severity 1 ghost"]').first().scrollIntoViewIfNeeded();
  await hoverSmooth('button[aria-label^="Severity 1 ghost"]');
  await until(segments[1].end);

  // 3. The keyboard path: Tab to The Cellar, arrows between ghosts, Tab and Shift+Tab, then Enter.
  mark(2);
  await page.mouse.move(VIEWPORT.width - 30, VIEWPORT.height - 30, { steps: 10 }); // out of the way of the key box
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
  const focused = () => page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
  for (let i = 0; i < 25 && !(await focused()).includes("ghost in The Cellar"); i++) await press("Tab");
  await press("ArrowRight", "→");
  await press("ArrowRight", "→");
  await press("Tab");
  await press("Shift+Tab", "Shift+Tab");
  await press("ArrowLeft", "←");
  await press("ArrowLeft", "←");
  await until(segments[2].end - 2);
  await press("Enter");
  await key("");
  await until(segments[2].end);

  // 4. One ghost, up close; Escape returns focus to the ghost.
  mark(3);
  const dialog = page.locator("dialog[open]");
  checks.push(`detail panel quote: ${(await dialog.locator("blockquote").textContent().catch(() => null)) ?? "(no dialog)"}`);
  for (const part of ["h2", "blockquote", "h3", "p:last-of-type"]) {
    await hoverSmooth(`dialog[open] ${part}`);
    await page.waitForTimeout(2500);
  }
  await until(segments[3].end - 3);
  await press("Escape");
  await key("");
  checks.push(`focus after Escape: ${await focused()}`);
  await dialog.waitFor({ state: "detached" }).catch(() => undefined);
  await until(segments[3].end);

  // 5. A mild policy, with the lights on.
  mark(4);
  await page.getByRole("button", { name: "Read another policy" }).click();
  await page.locator("#policy-text").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.getByRole("region", { name: "Or open a sample house" }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Open this house: Quillwhisper Notes" }).click();
  await page.getByText("Inside the house").waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(5000);
  await page.getByRole("button", { name: "Lights on" }).click();
  await page.waitForTimeout(3000);
  await page.getByText("A reassurance in this clause lowers its severity.").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  await page.getByText("Quiet", { exact: true }).first().scrollIntoViewIfNeeded();
  await until(segments[4].end);

  // 6. How it was built with Kiro: the repository's real .kiro/ files.
  mark(5);
  await open(pathToFileURL(kiroFile).href);
  const span = segments[5].end - segments[5].start;
  for (const [i, id] of ["tree", "ears", "reports", "property"].entries()) {
    await until(segments[5].start + (span * i) / 4);
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.evaluate((x) => document.getElementById(x)?.scrollIntoView({ behavior: "smooth", block: "start" }), id);
  }
  await until(segments[5].end);

  // 7. End card on the terrible house.
  mark(6);
  await open(url);
  await page.getByRole("button", { name: "Open this house: Murkwillow Social" }).click();
  await page.getByText("Inside the house").waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await card("The Haunted Clause · Built with Kiro for Kiroween 2026 · Costume Contest · Not legal advice");
  await until(segments[6].end + 0.5);

  captionsDone = true;
  await captionLoop;
  const recorded = elapsed();
  const video = page.video();
  await context.close();
  await browser.close();
  const rawPath = await video!.path();
  const webm = join(outDir, "demo.webm");
  renameSync(rawPath, webm);
  rmSync(rawDir, { recursive: true, force: true });

  console.log(`record-demo: ${webm} (0:00 starts ${offsetSeconds.toFixed(1)} s into the file; script ${total} s, recorded ${recorded.toFixed(1)} s)`);
  for (const l of [...actual, ...checks]) console.log(`record-demo: ${l}`);

  if (hasFullFfmpeg()) {
    const mp4 = join(outDir, "demo.mp4");
    const r = spawnSync("ffmpeg", ["-y", "-ss", offsetSeconds.toFixed(2), "-i", webm, "-t", String(total), "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", mp4], { stdio: "inherit" });
    console.log(r.status === 0 ? `record-demo: wrote ${mp4}` : "record-demo: ffmpeg failed; demo.webm is kept");
  } else {
    console.log("record-demo: no full ffmpeg on PATH, so only demo.webm was written. Install one with: brew install ffmpeg");
    console.log(`record-demo: then convert with: ffmpeg -y -ss ${offsetSeconds.toFixed(2)} -i video/demo.webm -t ${total} -an -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart video/demo.mp4`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
