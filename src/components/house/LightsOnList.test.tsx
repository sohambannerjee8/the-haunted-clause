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
  it("shows the reassurance line for a mitigated finding, and only there (R8.2, C13)", () => {
    const { model } = modelFor("mild");
    const { container } = render(<LightsOnList model={model} />);
    const all = model.flatMap((m) => m.items);
    const mitigated = all.filter((f) => f.mitigationId !== null);
    expect(mitigated.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThan(mitigated.length);
    for (const f of all) {
      const li = container.querySelector(`li[data-finding-id="${f.id}"]`) as HTMLElement;
      const line = within(li).queryByText("A reassurance in this clause lowers its severity.");
      if (f.mitigationId) expect(line, f.id).not.toBeNull();
      else expect(line, f.id).toBeNull();
    }
  });
  it("mild sample: the mitigated Cellar finding shows the mitigation's explanation, not the rule's (C13)", () => {
    const { model } = modelFor("mild");
    render(<LightsOnList model={model} />);
    const cellar = model.find((m) => m.room.id === "cellar")!.items[0];
    expect(cellar.mitigationId).toBe("cellar.no-sell");
    const section = screen.getByRole("region", { name: "The Cellar" });
    expect(within(section).getByText(/promises not to sell/i)).toBeInTheDocument();
    expect(within(section).queryByText(/lets the company sell/i)).toBeNull();
  });
  it("starts with the Not legal advice notice", () => {
    const { container } = render(<LightsOnList model={modelFor("mild").model} />);
    expect(container.firstElementChild!.textContent).toMatch(/^Not legal advice/);
  });
  it("lists every finding of a room with more than 12 (C22.2: the cap is for the house only)", () => {
    const text = Array.from({ length: 20 }, (_, i) => `We use cookies to remember your choices on screen ${i + 1}.`).join("\n\n");
    const r = analyze(text);
    if (!r.ok) throw new Error("too long");
    const model = buildHouseModel(mergeFindings(r.findings, []));
    expect(model[1].items).toHaveLength(20);
    render(<LightsOnList model={model} />);
    const section = screen.getByRole("region", { name: "The Watching Portraits" });
    for (let i = 1; i <= 20; i++) expect(within(section).getByText(`We use cookies to remember your choices on screen ${i}.`)).toBeInTheDocument();
  });
  it("shows the score scale line near the top, after the notice and before the first room, with the current band highlighted (R8.6, C24)", () => {
    const { container } = render(<LightsOnList model={modelFor("mild").model} />);
    const scale = screen.getByTestId("score-scale");
    expect(scale).toHaveTextContent("Scores run from 0 to 97, the most haunted a policy can be:");
    expect(scale.querySelector("[aria-current]")).toHaveTextContent("0–24 Mostly quiet"); // mild scores 14
    const firstRoom = container.querySelector("section");
    expect(scale.compareDocumentPosition(firstRoom!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.firstElementChild!.textContent).toMatch(/^Not legal advice/);
  });
  it("highlights the band of the shown findings' score: terrible is 75+ Run", () => {
    render(<LightsOnList model={modelFor("terrible").model} />);
    expect(screen.getByTestId("score-scale").querySelector("[aria-current]")).toHaveTextContent("75+ Run");
  });
});
