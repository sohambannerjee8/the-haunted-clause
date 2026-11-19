import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InputScreen, type InputNotice } from "./InputScreen";

function Harness({ initial = "", onAnalyze = vi.fn(), initialNotice }: { initial?: string; onAnalyze?: (text: string) => void; initialNotice?: InputNotice }) {
  const [text, setText] = useState(initial);
  const [notice, setNotice] = useState<InputNotice | undefined>(initialNotice);
  return (
    <InputScreen
      text={text}
      notice={notice}
      onChange={(t, n) => {
        setText(t);
        setNotice(n);
      }}
      onAnalyze={() => {
        if (text.trim() === "") setNotice("empty");
        else onAnalyze(text);
      }}
    />
  );
}
const textarea = () => screen.getByLabelText("Paste a Terms & Conditions or privacy policy") as HTMLTextAreaElement;

describe("InputScreen (R2)", () => {
  it("has the labelled textarea, the counter and the Analyze button (R2.1)", () => {
    render(<Harness />);
    expect(textarea().tagName).toBe("TEXTAREA");
    expect(screen.getByText("0 / 50,000 characters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyze" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Read a policy" })).toBeInTheDocument();
  });
  it("formats the counter with thousands separators", () => {
    render(<Harness initial={"x".repeat(1234)} />);
    expect(screen.getByText("1,234 / 50,000 characters")).toBeInTheDocument();
  });
  it("updates the counter as the user types", async () => {
    render(<Harness />);
    await userEvent.type(textarea(), "Hello");
    expect(screen.getByText("5 / 50,000 characters")).toBeInTheDocument();
  });
  it("the counter has aria-live=off and sits in no live region (R2.6)", () => {
    render(<Harness />);
    const counter = screen.getByText("0 / 50,000 characters");
    expect(counter).toHaveAttribute("aria-live", "off");
    for (let el: HTMLElement | null = counter.parentElement; el; el = el.parentElement) {
      expect(el.getAttribute("role") ?? "").not.toMatch(/^(status|alert|log)$/);
      expect(el.getAttribute("aria-live") ?? "off").toBe("off");
    }
  });
  it("sets maxLength to 50,000 (R2.2)", () => {
    render(<Harness />);
    expect(textarea().maxLength).toBe(50_000);
  });
  it("cuts a paste that would pass the cap and shows the notice in a polite live region (R2.3)", () => {
    render(<Harness initial={"a".repeat(10)} />);
    const t = textarea();
    t.setSelectionRange(10, 10);
    fireEvent.paste(t, { clipboardData: { getData: () => "b".repeat(60_000) } });
    expect(t.value.length).toBe(50_000);
    expect(t.value).toBe("a".repeat(10) + "b".repeat(49_990));
    const status = screen.getByText("Your text was cut at 50,000 characters.");
    expect(status.closest('[role="status"]')).not.toBeNull();
  });
  it("replaces the selection when cutting a paste", () => {
    render(<Harness initial={"abcdef"} />);
    const t = textarea();
    t.setSelectionRange(2, 4); // "cd" is replaced
    fireEvent.paste(t, { clipboardData: { getData: () => "z".repeat(50_000) } });
    expect(t.value).toBe("ab" + "z".repeat(49_998));
  });
  it("lets a paste that fits through unchanged, with no notice", () => {
    render(<Harness />);
    const t = textarea();
    const event = fireEvent.paste(t, { clipboardData: { getData: () => "short" } });
    expect(event).toBe(true); // not prevented: the browser inserts it
    expect(screen.queryByText("Your text was cut at 50,000 characters.")).toBeNull();
  });
  it.each(["", "   \n\t "])("empty or whitespace text %j shows the message with aria-invalid and aria-describedby (R2.4)", async (initial) => {
    const onAnalyze = vi.fn();
    render(<Harness initial={initial} onAnalyze={onAnalyze} />);
    await userEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(onAnalyze).not.toHaveBeenCalled();
    const msg = screen.getByText("Paste a policy or pick a sample first.");
    expect(textarea()).toHaveAttribute("aria-invalid", "true");
    expect(textarea().getAttribute("aria-describedby")?.split(" ")).toContain(msg.id);
  });
  it("clears the empty message when the user types", async () => {
    render(<Harness initialNotice="empty" />);
    await userEvent.type(textarea(), "x");
    expect(screen.queryByText("Paste a policy or pick a sample first.")).toBeNull();
    expect(textarea()).not.toHaveAttribute("aria-invalid", "true");
  });
  it("calls onAnalyze with the text", async () => {
    const onAnalyze = vi.fn();
    render(<Harness initial="We may sell your data." onAnalyze={onAnalyze} />);
    await userEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(onAnalyze).toHaveBeenCalledWith("We may sell your data.");
  });
  it("shows the too-long message (R16.6)", () => {
    render(<Harness initialNotice="too-long" />);
    expect(screen.getByText("That text is longer than 50,000 characters.")).toBeInTheDocument();
  });
  it("explains, under the paste box, that the text stays in the browser and what the app does (C25.1)", () => {
    render(<Harness />);
    const note = screen.getByText("Your text is read in your browser and never stored. The app finds risky clauses and files each one in a room of the house.");
    expect(note.tagName).toBe("P");
    expect(note).toHaveClass("text-mist", "text-base");
    expect(note.className).not.toMatch(/font-display/);
    expect(textarea().compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
