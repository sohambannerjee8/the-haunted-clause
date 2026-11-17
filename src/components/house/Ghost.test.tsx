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
