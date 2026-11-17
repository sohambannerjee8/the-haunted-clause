import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ROOMS } from "../../lib/analyzer/rooms";
import type { Severity } from "../../lib/analyzer/types";
import type { ExplainedFinding } from "../../lib/llm/merge";
import { DetailDialog } from "./DetailDialog";

// jsdom has no showModal/close; a minimal stand-in that behaves like the browser for these tests.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal: () => void; close: () => void };
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  proto.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

const QUOTE = "  We may sell <b>your</b> data\n  to partners.  ";
const finding = (over: Partial<ExplainedFinding> = {}): ExplainedFinding => ({
  id: "c-10",
  room: "cellar",
  severity: 3,
  quote: QUOTE,
  start: 10,
  end: 10 + QUOTE.length,
  ruleId: "r",
  mitigationId: null,
  cancelledMitigationId: null,
  explanation: "They can sell what they know about you.",
  whyItMatters: "Strangers may build a profile of you.",
  source: "rules",
  ...over,
});

function Harness({ f, ruleSeverity = f.severity }: { f: ExplainedFinding; ruleSeverity?: Severity }) {
  const [open, setOpen] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <button type="button" onClick={(e) => setOpen(e.currentTarget)}>
        opener
      </button>
      {open && <DetailDialog finding={f} ruleSeverity={ruleSeverity} room={ROOMS[0]} opener={open} onClose={() => setOpen(null)} />}
    </>
  );
}
async function openIt(f: ExplainedFinding, ruleSeverity?: Severity) {
  render(<Harness f={f} ruleSeverity={ruleSeverity} />);
  await userEvent.click(screen.getByRole("button", { name: "opener" }));
  return document.querySelector("dialog")!;
}

describe("DetailDialog (R6, R13.1, R19.3)", () => {
  it("is a modal dialog labelled by its h2 title, the room name", async () => {
    const dialog = await openIt(finding());
    expect(dialog).toHaveAttribute("open");
    const title = within(dialog).getByRole("heading", { level: 2, name: "The Cellar" });
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
  });
  it("shows the severity, the exact quote with its whitespace, both texts, the badge and the notice (R6.2)", async () => {
    const dialog = await openIt(finding());
    expect(within(dialog).getByText("3")).toBeInTheDocument();
    expect(within(dialog).getByText("Serious concern")).toBeInTheDocument();
    const quote = dialog.querySelector("blockquote")!;
    expect(quote.textContent).toBe(QUOTE);
    expect(within(dialog).getByText("They can sell what they know about you.")).toBeInTheDocument();
    expect(within(dialog).getByText("Why it matters")).toBeInTheDocument();
    expect(within(dialog).getByText("Strangers may build a profile of you.")).toBeInTheDocument();
    expect(within(dialog).getByText("Rule reading")).toBeInTheDocument();
    expect(within(dialog).getByText(/Not legal advice/)).toBeInTheDocument();
  });
  it("shows a quote containing <b> as literal text, never as HTML (R6.5)", async () => {
    const dialog = await openIt(finding());
    expect(dialog.querySelector("blockquote b")).toBeNull();
    expect(dialog.querySelector("blockquote")!.textContent).toContain("<b>your</b>");
  });
  it("shows the Medium's reading badge for an LLM finding", async () => {
    const dialog = await openIt(finding({ source: "llm" }));
    expect(within(dialog).getByText("Medium's reading")).toBeInTheDocument();
    expect(within(dialog).queryByText("Rule reading")).toBeNull();
  });
  it("shows the mitigation note when a reassurance lowered the severity (R6.3)", async () => {
    const dialog = await openIt(finding({ severity: 0, mitigationId: "m-no-sell" }));
    expect(within(dialog).getByText("A reassurance in this clause lowers its severity.")).toBeInTheDocument();
    expect(within(dialog).queryByText(/then adds an exception/)).toBeNull();
  });
  it("shows the cancelled-mitigation note (R6.3)", async () => {
    const dialog = await openIt(finding({ severity: 1, cancelledMitigationId: "m-no-sell" }));
    expect(within(dialog).getByText("This clause starts with a reassurance, then adds an exception.")).toBeInTheDocument();
  });
  it("says when the medium raised the severity (R6.4)", async () => {
    const dialog = await openIt(finding({ severity: 3, source: "llm" }), 1);
    expect(within(dialog).getByText("The medium raised this from 1 to 3.")).toBeInTheDocument();
  });
  it("has no raised note when the severity is unchanged", async () => {
    const dialog = await openIt(finding({ source: "llm" }), 3);
    expect(within(dialog).queryByText(/The medium raised/)).toBeNull();
  });
  it("Close closes it and returns focus to the opener (R6.6)", async () => {
    const dialog = await openIt(finding());
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(document.querySelector("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "opener" })).toHaveFocus();
  });
  it("calls onOpen sound hook when given", async () => {
    const onShown = vi.fn();
    render(<DetailDialog finding={finding()} ruleSeverity={3} room={ROOMS[0]} opener={null} onClose={() => {}} onShown={onShown} />);
    expect(onShown).toHaveBeenCalledWith(3);
  });
});
