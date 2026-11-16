// Assets made in this project only (haunted-house-ui R1.4, R1.5, R11.4).
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
// Files not yet committed in this task are checked too: anything under src/ on disk.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const onDisk = walk("src").map((p) => p.split("\\").join("/"));
const all = [...new Set([...tracked, ...onDisk])];

const AUDIO = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba)$/i;
const IMAGE = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?)$/i;
const FONT = /\.(ttf|otf|woff2?|eot)$/i;

describe("assets", () => {
  it("ships no audio files (R11.4)", () => {
    expect(all.filter((p) => AUDIO.test(p))).toEqual([]);
  });
  it("has no `new Audio(` or `<audio` in src/ (R11.4)", () => {
    for (const p of onDisk.filter((f) => /\.(ts|tsx|css)$/.test(f) && !/\.test\.(ts|tsx)$/.test(f))) {
      const text = readFileSync(p, "utf8");
      expect(text, p).not.toMatch(/new\s+Audio\s*\(|<audio\b/);
    }
  });
  it("the only image in src/ is src/app/icon.svg (R1.5)", () => {
    expect(all.filter((p) => p.startsWith("src/") && IMAGE.test(p))).toEqual(["src/app/icon.svg"]);
  });
  it("has no public/ images", () => {
    expect(all.filter((p) => p.startsWith("public/") && IMAGE.test(p))).toEqual([]);
  });
  it("keeps every font file under src/app/fonts/ (R1.4)", () => {
    const fonts = all.filter((p) => FONT.test(p) && !p.startsWith("node_modules/"));
    expect(fonts.length).toBeGreaterThan(0);
    for (const f of fonts) expect(f.startsWith("src/app/fonts/"), f).toBe(true);
  });
  it("has an SIL OFL 1.1 licence file for each font family (R1.4)", () => {
    const fonts = all.filter((p) => p.startsWith("src/app/fonts/") && FONT.test(p));
    for (const f of fonts) {
      const family = f.split("/").pop()!.split("-")[0];
      const licence = `src/app/fonts/OFL-${family}.txt`;
      expect(all, `${f} needs ${licence}`).toContain(licence);
      expect(readFileSync(licence, "utf8")).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });
});
