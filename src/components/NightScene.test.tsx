import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NightScene } from "./NightScene";

describe("NightScene (C14.1)", () => {
  it("is decorative only: one aria-hidden SVG with a moon and the house silhouette, and no text", () => {
    const { container } = render(<NightScene />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelector("[data-moon]")).not.toBeNull();
    expect(svg.querySelector("[data-house-silhouette]")).not.toBeNull();
    expect(svg.textContent?.trim()).toBe("");
    expect(svg.querySelector("text, title, desc")).toBeNull();
  });
  it("sits behind the content and takes no pointer events", () => {
    const { container } = render(<NightScene />);
    expect(container.firstElementChild).toHaveClass("pointer-events-none");
  });
});
