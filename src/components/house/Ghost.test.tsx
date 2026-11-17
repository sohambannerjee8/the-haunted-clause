import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ROOMS } from "../../lib/analyzer/rooms";
import type { Finding, Severity } from "../../lib/analyzer/types";
import { Ghost } from "./Ghost";

const cellar = ROOMS[0];
const finding = (severity: Severity): Finding => ({
  id: "c-42",
  room: "cellar",
  severity,
  quote: "q",
  start: 42,
  end: 43,
  ruleId: "r",
  mitigationId: null,
  cancelledMitigationId: null,
  explanation: "e",
  whyItMatters: "w",
});
const LABELS = [
  "Severity 0 wisp in The Cellar: looks fine",
  "Severity 1 ghost in The Cellar: mild concern",
  "Severity 2 ghost in The Cellar: real concern",
  "Severity 3 ghost in The Cellar: serious concern",
];

describe("Ghost (R5.1–R5.5)", () => {
  it.each([0, 1, 2, 3] as const)("level %i: a button with data-severity, data-finding-id, the label, the numeral and the level class", (s) => {
    render(<Ghost finding={finding(s)} room={cellar} tabIndex={0} onOpen={() => {}} />);
    const b = screen.getByRole("button", { name: LABELS[s] });
    expect(b.tagName).toBe("BUTTON");
    expect(b).toHaveAttribute("type", "button");
    expect(b).toHaveAttribute("data-severity", String(s));
    expect(b).toHaveAttribute("data-finding-id", "c-42");
    expect(b).toHaveTextContent(String(s));
    expect(b).toHaveClass("hc-ghost", `hc-level-${s}`);
    expect(b).toHaveStyle({ minWidth: "44px", minHeight: "44px" });
    expect(b.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
  it("draws a different shape for each level: wisp, faint, uneasy, tattered with glowing eyes (C14.3)", () => {
    const shapes = ([0, 1, 2, 3] as const).map((s) => {
      const { container, unmount } = render(<Ghost finding={finding(s)} room={cellar} tabIndex={0} onOpen={() => {}} />);
      const svg = container.querySelector("svg.hc-art")!;
      const out = { shape: svg.getAttribute("data-shape"), html: svg.innerHTML, glow: svg.querySelectorAll(".hc-eye-glow").length };
      unmount();
      return out;
    });
    expect(shapes.map((x) => x.shape)).toEqual(["wisp", "faint", "uneasy", "tattered"]);
    expect(new Set(shapes.map((x) => x.html)).size).toBe(4);
    expect(shapes[3].glow).toBeGreaterThan(0);
    expect(shapes[0].glow + shapes[1].glow + shapes[2].glow).toBe(0);
  });
  it("level 2 looks worried, not angry; level 3 is the most menacing face (C15)", () => {
    const art = (s: Severity) => {
      const { container, unmount } = render(<Ghost finding={finding(s)} room={cellar} tabIndex={0} onOpen={() => {}} />);
      const svg = container.querySelector("svg.hc-art")!.cloneNode(true) as SVGElement;
      unmount();
      return svg;
    };
    const two = art(2);
    const three = art(3);
    expect(two.getAttribute("data-face")).toBe("worried");
    expect(two.querySelector('[data-part="brows-worried"]')).not.toBeNull();
    expect(two.querySelector('[data-part="mouth-jagged"]')).toBeNull();
    expect(two.querySelectorAll(".hc-eye-glow")).toHaveLength(0);
    expect(three.getAttribute("data-face")).toBe("menacing");
    expect(three.querySelectorAll(".hc-eye-glow").length).toBeGreaterThanOrEqual(2);
    expect(three.querySelector('[data-part="mouth-jagged"]')).not.toBeNull();
    expect(three.querySelector('[data-part="hem-dark"]')).not.toBeNull();
    // Levels 0 and 1 carry no face drama.
    expect(art(0).getAttribute("data-face")).toBe("none");
    expect(art(1).getAttribute("data-face")).toBe("calm");
  });
  it("calls onOpen with the finding and the button", async () => {
    const onOpen = vi.fn();
    render(<Ghost finding={finding(2)} room={cellar} tabIndex={0} onOpen={onOpen} />);
    const b = screen.getByRole("button");
    await userEvent.click(b);
    expect(onOpen).toHaveBeenCalledWith(finding(2), b);
  });
  it("uses the given tabIndex", () => {
    render(<Ghost finding={finding(1)} room={cellar} tabIndex={-1} onOpen={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("tabindex", "-1");
  });
});
