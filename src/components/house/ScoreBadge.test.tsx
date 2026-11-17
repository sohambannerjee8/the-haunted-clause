import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScoreBadge } from "./ScoreBadge";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("ScoreBadge (R7.1, R7.3)", () => {
  it('shows "N · band" with no /100', () => {
    const { container } = render(<ScoreBadge score={97} />);
    expect(screen.getByTestId("haunt-score")).toHaveTextContent("97 · Run");
    expect(container.textContent).not.toContain("/100");
    expect(container.textContent).not.toContain("100");
  });
  it.each([
    [0, "0 · Mostly quiet"],
    [14, "14 · Mostly quiet"],
    [59, "59 · Haunted"],
  ])("score %i reads %s", (score, text) => {
    render(<ScoreBadge score={score} />);
    expect(screen.getByTestId("haunt-score")).toHaveTextContent(text);
  });
  it("makes the band the main phrase, larger than the number, as the hero (C14.4)", () => {
    render(<ScoreBadge score={97} />);
    const band = screen.getByTestId("haunt-band");
    expect(band).toHaveTextContent("Run");
    expect(band).toHaveClass("hc-score-band", "font-display");
    expect(screen.getByTestId("haunt-number")).toHaveClass("hc-score-number");
    expect(screen.getByTestId("haunt-score")).toHaveTextContent("97 · Run");
    expect(screen.getByTestId("haunt-score").closest("[data-score-hero]")).not.toBeNull();
  });
  it("announces the score in a polite live region once, and again only when it changes", () => {
    const { rerender } = render(<ScoreBadge score={14} />);
    const status = screen.getByRole("status");
    act(() => vi.advanceTimersByTime(200));
    expect(status).toHaveTextContent("Haunt Score 14, Mostly quiet");
    const node = status.firstChild;

    rerender(<ScoreBadge score={14} />);
    act(() => vi.advanceTimersByTime(200));
    expect(status.firstChild).toBe(node); // same text node: nothing new announced

    rerender(<ScoreBadge score={59} />);
    act(() => vi.advanceTimersByTime(200));
    expect(status).toHaveTextContent("Haunt Score 59, Haunted");
  });
});
