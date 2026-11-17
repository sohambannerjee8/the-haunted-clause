import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Finding, RoomId, Severity } from "../../lib/analyzer/types";
import { buildHouseModel } from "../../lib/ui/houseModel";
import { Room } from "./Room";

const f = (start: number, room: RoomId, severity: Severity): Finding => ({
  id: `c-${start}`,
  room,
  severity,
  quote: "q",
  start,
  end: start + 1,
  ruleId: "r",
  mitigationId: null,
  cancelledMitigationId: null,
  explanation: "e",
  whyItMatters: "w",
});

describe("Room (R4.1, R4.3–R4.5, R9.2)", () => {
  it("a quiet room shows Quiet, has no buttons, and is named '<Room>, quiet'", () => {
    const [cellar] = buildHouseModel([]);
    render(<Room model={cellar} onOpen={() => {}} />);
    const section = screen.getByRole("region", { name: "The Cellar, quiet" });
    expect(within(section).getByText("Quiet")).toBeInTheDocument();
    expect(within(section).queryAllByRole("button")).toHaveLength(0);
    expect(within(section).getByRole("heading", { level: 3, name: "The Cellar" })).toBeInTheDocument();
    expect(within(section).getByText("Data sharing and selling")).toBeInTheDocument();
  });
  it("a room with findings shows the status line, the group label and one button per finding in order", () => {
    const m = buildHouseModel([f(0, "cellar", 3), f(10, "cellar", 0), f(20, "cellar", 1)]);
    render(<Room model={m[0]} onOpen={() => {}} />);
    const name = "The Cellar, 2 ghosts, worst: serious concern, 1 checked, looks fine";
    const section = screen.getByRole("region", { name });
    expect(within(section).getByText("2 ghosts · 1 checked, looks fine")).toBeInTheDocument();
    const group = within(section).getByRole("group", { name });
    expect(within(group).getAllByRole("button").map((b) => b.getAttribute("data-finding-id"))).toEqual(["c-0", "c-10", "c-20"]);
  });
  it("draws no ghost art in a quiet room", () => {
    const [cellar] = buildHouseModel([]);
    const { container } = render(<Room model={cellar} onOpen={() => {}} />);
    expect(container.querySelector(".hc-ghost")).toBeNull();
  });
});
