import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { analyze } from "../../lib/analyzer/analyze";
import { ROOMS } from "../../lib/analyzer/rooms";
import { mergeFindings } from "../../lib/llm/merge";
import { SAMPLES } from "../../lib/samples";
import { buildHouseModel, severityLabel } from "../../lib/ui/houseModel";
import { LightsOnList } from "./LightsOnList";

function modelFor(id: "mild" | "average" | "terrible") {
  const r = analyze(SAMPLES.find((s) => s.id === id)!.text);
  if (!r.ok) throw new Error("too long");
  const findings = mergeFindings(r.findings, id === "average" ? [{ id: r.findings[0].id, plainEnglish: "Medium text.", whyItMatters: "Medium why.", severity: 3 }] : []);
  return { findings, model: buildHouseModel(findings) };
}

describe("LightsOnList (R8.2–R8.4, R13.1)", () => {
  it("lists the eight rooms in order as h3 headings", () => {
    render(<LightsOnList model={modelFor("mild").model} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(ROOMS.map((r) => r.name));
  });
  it.each(["mild", "average", "terrible"] as const)("%s: holds the same findings as the model, in order, with all their texts", (id) => {
    const { findings, model } = modelFor(id);
    const { container } = render(<LightsOnList model={model} />);
    const items = [...container.querySelectorAll("li[data-finding-id]")];
    const byRoom = model.flatMap((m) => m.items);
    expect(items.map((li) => li.getAttribute("data-finding-id"))).toEqual(byRoom.map((f) => f.id));
    expect(items).toHaveLength(findings.length);
    for (const [i, f] of byRoom.entries()) {
      const li = items[i] as HTMLElement;
      expect(li.getAttribute("data-severity")).toBe(String(f.severity));
      expect(li.querySelector("blockquote")!.textContent).toBe(f.quote);
      expect(within(li).getByText(severityLabel(f.severity))).toBeInTheDocument();
      expect(within(li).getByText(f.explanation)).toBeInTheDocument();
      expect(within(li).getByText(f.whyItMatters)).toBeInTheDocument();
      expect(within(li).getByText(f.source === "llm" ? "Medium's reading" : "Rule reading")).toBeInTheDocument();
    }
  });
  it("shows Quiet for a room with no findings", () => {
    const { model } = modelFor("mild");
    render(<LightsOnList model={model} />);
    const quiet = model.filter((m) => m.items.length === 0);
    expect(quiet.length).toBeGreaterThan(0);
    for (const m of quiet) {
      const section = screen.getByRole("region", { name: m.room.name });
      expect(within(section).getByText("Quiet")).toBeInTheDocument();
    }
  });
  it("has no SVG, no ghost or animation classes", () => {
    const { container } = render(<LightsOnList model={modelFor("terrible").model} />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector('[class*="hc-"]')).toBeNull();
    // Check attributes, not the policy text (the terrible sample says "promotions").
    for (const el of container.querySelectorAll("*")) {
      expect(el.getAttribute("class") ?? "").not.toMatch(/animate|motion/i);
      expect(el.getAttribute("style") ?? "").not.toMatch(/animation|transition/i);
    }
  });
  it("starts with the Not legal advice notice", () => {
    const { container } = render(<LightsOnList model={modelFor("mild").model} />);
    expect(container.firstElementChild!.textContent).toMatch(/^Not legal advice/);
  });
});
