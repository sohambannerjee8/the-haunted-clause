import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreScale, SCALE_TEXT } from "./ScoreScale";

const LINE = "Scores run from 0 to 97, the most haunted a policy can be: 0–24 Mostly quiet · 25–49 Uneasy · 50–74 Haunted · 75+ Run.";
/** The line as shown: the current band is followed by a visible text marker (C25.2). */
const shown = (band: string) => LINE.replace(band, `${band} (this policy)`);

describe("ScoreScale (haunted-house-ui R7.4, PLAN_DECISIONS.md C24)", () => {
  it("reads the scale line word for word, with no /100", () => {
    const { container } = render(<ScoreScale score={14} />);
    expect(SCALE_TEXT).toBe(LINE);
    expect(container.textContent).toBe(shown("0–24 Mostly quiet"));
    expect(container.textContent).not.toContain("/100");
  });
  it("is in the body font and mist colour, at least 16 px", () => {
    render(<ScoreScale score={14} />);
    const p = screen.getByTestId("score-scale");
    expect(p.tagName).toBe("P");
    expect(p).toHaveClass("text-mist", "text-base");
    expect(p.className).not.toMatch(/font-display/);
  });
  it.each([
    [0, "0–24 Mostly quiet"],
    [14, "0–24 Mostly quiet"],
    [24, "0–24 Mostly quiet"],
    [25, "25–49 Uneasy"],
    [49, "25–49 Uneasy"],
    [50, "50–74 Haunted"],
    [59, "50–74 Haunted"],
    [74, "50–74 Haunted"],
    [75, "75+ Run"],
    [97, "75+ Run"],
  ])("score %i highlights %s: bold and aria-current, and only that band", (score, band) => {
    const { container } = render(<ScoreScale score={score} />);
    const current = container.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(band);
    expect(current[0]).toHaveAttribute("aria-current", "true");
    expect(current[0].tagName).toBe("STRONG"); // bold, so the highlight is not colour alone
    expect(container.querySelectorAll("strong")).toHaveLength(1);
  });
  it.each([
    [14, "0–24 Mostly quiet"],
    [59, "50–74 Haunted"],
    [97, "75+ Run"],
  ])("score %i marks %s with the visible text '(this policy)', once, right after the band (C25.2)", (score, band) => {
    const { container } = render(<ScoreScale score={score} />);
    expect(container.textContent).toBe(shown(band));
    expect(container.textContent!.match(/\(this policy\)/g)).toHaveLength(1);
  });
});
