import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SAMPLE_META } from "../lib/samples/meta";
import { SampleCards } from "./SampleCards";

describe("SampleCards (R2.5)", () => {
  it("shows three cards, each with its company name and one-line description", () => {
    render(<SampleCards onOpen={() => {}} />);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
    SAMPLE_META.forEach((m, i) => {
      expect(within(cards[i]).getByRole("heading", { level: 3, name: m.company })).toBeInTheDocument();
      expect(within(cards[i]).getByText(m.blurb)).toBeInTheDocument();
    });
  });
  it("names each 'Open this house' button by its company", () => {
    render(<SampleCards onOpen={() => {}} />);
    for (const m of SAMPLE_META) {
      const b = screen.getByRole("button", { name: `Open this house: ${m.company}` });
      expect(b).toHaveTextContent("Open this house");
    }
  });
  it("draws each sample as a small house front with a door button of at least 44 px (C14.1)", () => {
    const { container } = render(<SampleCards onOpen={() => {}} />);
    for (const card of screen.getAllByRole("article")) {
      const front = card.querySelector("svg[data-house-front]");
      expect(front).not.toBeNull();
      expect(front).toHaveAttribute("aria-hidden", "true");
      const door = within(card).getByRole("button");
      expect(door).toHaveClass("hc-door");
      expect(door).toHaveStyle({ minWidth: "44px", minHeight: "44px" });
    }
    expect(container.querySelectorAll("svg[data-house-front] text")).toHaveLength(0);
  });
  it("calls onOpen with the sample ID", async () => {
    const onOpen = vi.fn();
    render(<SampleCards onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button", { name: /Murkwillow Social/ }));
    expect(onOpen).toHaveBeenCalledWith("terrible");
  });
  it("says the companies are fictional", () => {
    render(<SampleCards onOpen={() => {}} />);
    expect(screen.getByText(/fictional/i)).toBeInTheDocument();
  });
});
