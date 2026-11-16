import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExplainResponse } from "@/lib/llm/schema";

// connection() is mocked so the test can check that each 405 handler awaits it first.
let release: () => void = () => {};
const connection = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
vi.mock("next/server", () => ({ connection }));

const route = await import("./route");

beforeEach(() => {
  connection.mockClear();
  vi.stubEnv("GEMINI_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("route.ts exports (R1.2)", () => {
  it("exports POST, GET, PUT, PATCH, DELETE and maxDuration = 30, and no runtime", () => {
    for (const m of ["POST", "GET", "PUT", "PATCH", "DELETE"] as const) expect(typeof route[m]).toBe("function");
    expect(route.maxDuration).toBe(30);
    expect(route).not.toHaveProperty("runtime");
  });
});

describe("405 handlers (R1.3, R1.4, R8.2)", () => {
  it.each(["GET", "PUT", "PATCH", "DELETE"] as const)("%s awaits connection() and returns 405 with Allow: POST", async (m) => {
    let settled = false;
    const pending = route[m]().then((r) => {
      settled = true;
      return r;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(connection).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false); // nothing is built before connection() resolves
    release();
    const res = await pending;
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(ExplainResponse.safeParse(body).success).toBe(true);
    expect(body).toEqual({ source: "rules", reason: "bad-request", findings: [] });
  });
});

describe("POST with no key (R3.1)", () => {
  it("returns 200 rules/no-key with Cache-Control: no-store and makes no network call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await route.POST(
      new Request("http://localhost:3000/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost:3000", "x-forwarded-for": "198.51.100.1" },
        body: JSON.stringify({ clauses: [{ id: "c-0", room: "cellar", severity: 1, text: "We share data." }] }),
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ source: "rules", reason: "no-key", findings: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("one route (R1.1)", () => {
  const appDir = join(process.cwd(), "src/app");
  function walk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  }
  const files = walk(appDir).filter((p) => /\.(ts|tsx)$/.test(p) && !/\.test\.(ts|tsx)$/.test(p));
  const rel = (p: string) => relative(process.cwd(), p).split("\\").join("/");

  it("src/app holds exactly one route.ts, at api/explain", () => {
    expect(files.filter((p) => /(^|\/)route\.(ts|tsx)$/.test(rel(p))).map(rel)).toEqual(["src/app/api/explain/route.ts"]);
  });
  it("route.ts is the only file under src/app that imports gemini.ts", () => {
    const importers = files.filter((p) => /from\s+["'][^"']*\/llm\/gemini["']/.test(readFileSync(p, "utf8"))).map(rel);
    expect(importers).toEqual(["src/app/api/explain/route.ts"]);
  });
});
