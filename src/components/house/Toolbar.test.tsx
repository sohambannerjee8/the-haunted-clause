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
  it("has a Lights on toggle second, with aria-pressed, and focus stays on it (R8.1, R8.5, R10.5)", async () => {
    const { useState } = await import("react");
    function Harness() {
      const [on, setOn] = useState(false);
      return <Toolbar company={null} onBack={() => {}} lightsOn={on} onToggleLights={() => setOn((v) => !v)} />;
    }
    render(<Harness />);
    const toggle = screen.getAllByRole("button")[1];
    expect(toggle).toHaveTextContent("Lights on");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveTextContent("Lights on"); // the text stays; the pressed state carries the meaning
    expect(toggle).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveFocus();
  });
  it("has a Sound toggle third, off by default, with aria-pressed (R11.2)", async () => {
    const { useState } = await import("react");
    const onSound = vi.fn();
    function Harness() {
      const [on, setOn] = useState(false);
      return (
        <Toolbar
          company={null}
          onBack={() => {}}
          lightsOn={false}
          onToggleLights={() => {}}
          soundOn={on}
          onToggleSound={() => {
            onSound(!on);
            setOn(!on);
          }}
        />
      );
    }
    render(<Harness />);
    const toggle = screen.getAllByRole("button")[2];
    expect(toggle).toHaveTextContent("Sound");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onSound).toHaveBeenCalledWith(true);
    expect(toggle).toHaveFocus();
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
