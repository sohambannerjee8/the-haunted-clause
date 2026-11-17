import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROOMS } from "../../lib/analyzer/rooms";
import { buildHouseModel } from "../../lib/ui/houseModel";
import { House } from "./House";

describe("House (R4.1, R4.6)", () => {
  it("shows the eight rooms in room order", () => {
    render(<House model={buildHouseModel([])} onOpen={() => {}} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(ROOMS.map((r) => r.name));
  });
  it("hides the decorative frame from assistive technology, and it holds no text", () => {
    const { container } = render(<House model={buildHouseModel([])} onOpen={() => {}} />);
    const frame = container.querySelector("[data-house-frame]");
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute("aria-hidden", "true");
    expect(frame!.textContent?.trim()).toBe("");
    expect(frame!.querySelector("text, title, desc")).toBeNull();
  });
  it("lays the rooms out in 2 columns, and 4 from 768 px (R4.2)", () => {
    const { container } = render(<House model={buildHouseModel([])} onOpen={() => {}} />);
    const grid = container.querySelector("[data-house-grid]");
    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-4");
  });
});
