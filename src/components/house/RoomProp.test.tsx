import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROOMS } from "../../lib/analyzer/rooms";
import { buildHouseModel } from "../../lib/ui/houseModel";
import { Room } from "./Room";
import { RoomProp } from "./RoomProp";

describe("RoomProp (C14.2)", () => {
  it.each(ROOMS.map((r) => [r.id] as const))("%s: one aria-hidden SVG prop with no text", (id) => {
    const { container } = render(<RoomProp room={id} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveAttribute("aria-hidden", "true");
    expect(svgs[0]).toHaveAttribute("data-prop", id);
    expect(svgs[0].textContent?.trim()).toBe("");
    expect(svgs[0].querySelector("text, title, desc")).toBeNull();
  });
  it("draws a different prop for every room", () => {
    const drawings = ROOMS.map((r) => render(<RoomProp room={r.id} />).container.querySelector("svg")!.innerHTML);
    expect(new Set(drawings).size).toBe(8);
  });
  it("every room shows its prop, quiet or not, outside the ghost group", () => {
    const model = buildHouseModel([
      { id: "c-0", room: "cellar", severity: 2, quote: "q", start: 0, end: 1, ruleId: "r", mitigationId: null, cancelledMitigationId: null, explanation: "e", whyItMatters: "w" },
    ]);
    for (const m of model) {
      const { container, unmount } = render(<Room model={m} onOpen={() => {}} />);
      const prop = container.querySelector(`svg[data-prop="${m.room.id}"]`);
      expect(prop, m.room.id).not.toBeNull();
      expect(prop!.closest('[role="group"]')).toBeNull();
      unmount();
    }
  });
});
