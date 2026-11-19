import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HouseLegend } from "./HouseLegend";
import { GHOST_LEGEND, QUIET_NOTE } from "../../lib/ui/copy";

describe("HouseLegend (haunted-house-ui R4.9, PLAN_DECISIONS.md C25.3, C25.4)", () => {
  it("has the ghost legend and the Quiet note word for word", () => {
    expect(GHOST_LEGEND).toBe("Each ghost is one clause. 0 looks fine · 1 mild concern · 2 real concern · 3 serious concern.");
    expect(QUIET_NOTE).toBe("Quiet means no risky clause of this kind was found. It doesn't prove the policy is safe.");
    render(<HouseLegend />);
    expect(screen.getByText(GHOST_LEGEND).tagName).toBe("P");
    expect(screen.getByText(QUIET_NOTE).tagName).toBe("P");
  });
  it("is in the body font and mist colour, at least 16 px, with no art", () => {
    const { container } = render(<HouseLegend />);
    const legend = screen.getByTestId("house-legend");
    expect(legend).toHaveClass("text-mist", "text-base");
    expect(legend.className).not.toMatch(/font-display/);
    expect(container.querySelector("svg")).toBeNull();
  });
});
