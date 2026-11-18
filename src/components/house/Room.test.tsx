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

describe("Room roving tabindex (R9.1, R9.3, R9.4)", () => {
  const three = () => buildHouseModel([f(0, "vault", 3), f(10, "vault", 2), f(20, "vault", 0)])[2];
  const tabStops = () => screen.getAllByRole("button").filter((b) => b.getAttribute("tabindex") === "0");

  it("has exactly one tabindex=0 and the rest -1", () => {
    render(<Room model={three()} onOpen={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
  });
  it("arrows, Home and End move focus, wrapping around", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<Room model={three()} onOpen={() => {}} />);
    const [a, b, c] = screen.getAllByRole("button");
    a.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(b).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(c).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(a).toHaveFocus(); // wraps
    await userEvent.keyboard("{ArrowLeft}");
    expect(c).toHaveFocus(); // wraps back
    await userEvent.keyboard("{ArrowUp}");
    expect(b).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(a).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(c).toHaveFocus();
    expect(tabStops()).toEqual([c]);
  });
  it("keeps tabindex=0 on the last-focused ghost (focus memory)", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(
      <>
        <Room model={three()} onOpen={() => {}} />
        <button type="button">after</button>
      </>,
    );
    const [a, b] = screen.getAllByRole("button");
    a.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(b).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    expect(b).toHaveAttribute("tabindex", "0");
    await userEvent.tab({ shift: true });
    expect(b).toHaveFocus();
  });
  it("Tab leaves the room instead of visiting the next ghost (R9.5)", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(
      <>
        <Room model={three()} onOpen={() => {}} />
        <button type="button">after</button>
      </>,
    );
    screen.getAllByRole("button")[0].focus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });
});

describe("Room with more than 12 ghosts (C22.2, C22.3)", () => {
  // 15 findings: 3 at severity 1 first, then 12 at severity 2, so the three 1s are the ones hidden.
  const crowded = () =>
    buildHouseModel([...[0, 1, 2].map((i) => f(i, "portraits", 1)), ...Array.from({ length: 12 }, (_, i) => f(10 + i, "portraits", 2))])[1];
  const ghosts = () => screen.getAllByRole("button").filter((b) => b.hasAttribute("data-finding-id"));
  const toggle = () => screen.getByRole("button", { name: /more ghosts in The Watching Portraits|Show fewer ghosts in The Watching Portraits/ });

  it("shows the 12 most severe and a '+3 more' button; the room's name still counts all 15", () => {
    render(<Room model={crowded()} onOpen={() => {}} />);
    expect(screen.getByRole("region", { name: "The Watching Portraits, 15 ghosts, worst: real concern" })).toBeInTheDocument();
    expect(ghosts()).toHaveLength(12);
    expect(ghosts().every((b) => b.getAttribute("data-severity") === "2")).toBe(true);
    expect(toggle()).toHaveTextContent("+3 more");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveAccessibleName("+3 more ghosts in The Watching Portraits");
  });
  it("expands in place by mouse, and collapses again", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<Room model={crowded()} onOpen={() => {}} />);
    await userEvent.click(toggle());
    expect(ghosts()).toHaveLength(15);
    expect(ghosts().map((b) => b.getAttribute("data-finding-id"))).toEqual(crowded().items.map((x) => x.id)); // input order
    expect(toggle()).toHaveTextContent("Show fewer");
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(toggle());
    expect(ghosts()).toHaveLength(12);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });
  it("the button is part of the room's keyboard path: End reaches it, Enter and Space toggle it, focus stays on it", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<Room model={crowded()} onOpen={() => {}} />);
    ghosts()[0].focus();
    await userEvent.keyboard("{End}");
    expect(toggle()).toHaveFocus();
    expect(screen.getAllByRole("button").filter((b) => b.getAttribute("tabindex") === "0")).toEqual([toggle()]);
    await userEvent.keyboard("{Enter}");
    expect(ghosts()).toHaveLength(15);
    expect(toggle()).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(ghosts()[14]).toHaveFocus();
    await userEvent.keyboard("{End}");
    await userEvent.keyboard(" ");
    expect(ghosts()).toHaveLength(12);
    expect(toggle()).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(ghosts()[0]).toHaveFocus(); // wraps from the button to the first ghost
  });
  it("Tab still leaves the room from the button (R9.5)", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(
      <>
        <Room model={crowded()} onOpen={() => {}} />
        <button type="button">after</button>
      </>,
    );
    ghosts()[0].focus();
    await userEvent.keyboard("{End}");
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });
  it("a room with 12 or fewer has no button", () => {
    render(<Room model={buildHouseModel(Array.from({ length: 12 }, (_, i) => f(i, "cellar", 2)))[0]} onOpen={() => {}} />);
    expect(screen.queryByRole("button", { name: /more ghosts|Show fewer/ })).toBeNull();
  });
});
