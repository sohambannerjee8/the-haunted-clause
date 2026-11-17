import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SAMPLE_META } from "../../lib/samples/meta";
import { Toolbar } from "./Toolbar";

describe("Toolbar (R15.3, R17.4)", () => {
  it.each(SAMPLE_META.map((m) => [m.company]))("names the sample: %s (a fictional company)", (company) => {
    render(<Toolbar company={company} onBack={() => {}} />);
    expect(screen.getByText(`Sample: ${company} (a fictional company)`)).toBeInTheDocument();
  });
  it("has no sample line for pasted text", () => {
    render(<Toolbar company={null} onBack={() => {}} />);
    expect(screen.queryByText(/^Sample:/)).toBeNull();
  });
  it("has Read another policy first", async () => {
    const onBack = vi.fn();
    render(<Toolbar company={null} onBack={onBack} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("Read another policy");
    await userEvent.click(buttons[0]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
