import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hauntScore } from "../../lib/analyzer/score";
import { GEMINI_TERMS_URL, OPT_IN_NOTICE } from "../../lib/llm/privacy";
import type { ExplainResponse } from "../../lib/llm/schema";
import { HouseView } from "./HouseView";
import { prepare, type Prepared } from "./prepare";

const PASTED = "We may sell your personal information to data brokers. Your subscription renews automatically.";
const NO_MEDIUM = "These readings come from built-in rules. No medium is configured on this site.";

async function prepared(kind: "pasted" | "sample" = "pasted"): Promise<Prepared> {
  const r = await prepare(kind === "pasted" ? { kind: "pasted" } : { kind: "sample", id: "mild" }, PASTED);
  if (!r.ok) throw new Error("too long");
  return r.prepared;
}
const ask = () => screen.queryByRole("button", { name: "Ask the medium" });

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("OptInPanel (R14)", () => {
  it("is hidden when llmAvailable is false, and the 'no medium' line shows (R14.2)", async () => {
    const explain = vi.fn();
    render(<HouseView prepared={await prepared()} llmAvailable={false} onBack={() => {}} explain={explain} />);
    expect(ask()).toBeNull();
    expect(screen.getByText(NO_MEDIUM)).toBeInTheDocument();
    expect(explain).not.toHaveBeenCalled();
  });
  it("is hidden for samples (R14.3)", async () => {
    render(<HouseView prepared={await prepared("sample")} llmAvailable onBack={() => {}} explain={vi.fn()} />);
    expect(ask()).toBeNull();
    expect(screen.queryByText(NO_MEDIUM)).toBeNull();
  });
  it("shows the button, OPT_IN_NOTICE and the terms link for pasted text, and calls nothing without a press (R14.1, R14.7)", async () => {
    const explain = vi.fn();
    render(<HouseView prepared={await prepared()} llmAvailable onBack={() => {}} explain={explain} />);
    expect(ask()).toBeInTheDocument();
    expect(screen.getByText(OPT_IN_NOTICE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Google's Gemini API terms" })).toHaveAttribute("href", GEMINI_TERMS_URL);
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(explain).not.toHaveBeenCalled();
  });
  it("on press: one call with the rule findings, button disabled, 'listening' in a live region (R14.4)", async () => {
    let resolve!: (r: ExplainResponse) => void;
    const explain = vi.fn(() => new Promise<ExplainResponse>((r) => (resolve = r)));
    const p = await prepared();
    render(<HouseView prepared={p} llmAvailable onBack={() => {}} explain={explain} />);
    await userEvent.click(ask()!);
    expect(explain).toHaveBeenCalledTimes(1);
    expect(explain).toHaveBeenCalledWith(p.ruleFindings);
    expect(ask()).toBeDisabled();
    expect(screen.getByText("The medium is listening…").closest('[role="status"]')).not.toBeNull();
    await act(async () => resolve({ source: "rules", reason: "error", findings: [] }));
  });
  it("on success: merges, updates the score and badges, announces, hides the button (R14.5, R7.2)", async () => {
    const p = await prepared();
    // A finding the medium can raise: the renewal clause, below severity 3.
    const first = p.ruleFindings.find((f) => f.severity < 3)!;
    expect(first).toBeDefined();
    const explain = vi.fn(async (): Promise<ExplainResponse> => ({
      source: "llm",
      findings: [{ id: first.id, plainEnglish: "The medium's plain words.", whyItMatters: "The medium's reason.", severity: 3 }],
    }));
    render(<HouseView prepared={p} llmAvailable onBack={() => {}} explain={explain} />);
    const before = hauntScore(p.findings);
    expect(screen.getByTestId("haunt-score")).toHaveTextContent(new RegExp(`^${before} · `));
    await userEvent.click(ask()!);
    await waitFor(() => expect(screen.getByText("The medium has spoken.")).toBeInTheDocument());
    expect(ask()).toBeNull();
    const after = hauntScore(p.ruleFindings.map((f) => (f.id === first.id ? { ...f, severity: 3 as const } : f)));
    expect(after).toBeGreaterThan(before);
    expect(screen.getByTestId("haunt-score")).toHaveTextContent(new RegExp(`^${after} · `));
    expect(document.querySelector(`button.hc-ghost[data-finding-id="${first.id}"]`)).toHaveAttribute("data-severity", "3");
  });
  it.each([
    ["rate-limited", "The medium needs a rest. Try again in a minute.", true],
    ["timeout", "The medium took too long. Showing the rule reading.", true],
    ["error", "The medium is silent right now. Showing the rule reading.", true],
    ["invalid", "The medium is silent right now. Showing the rule reading.", true],
    ["bad-request", "The medium is silent right now. Showing the rule reading.", true],
    ["no-key", "The medium is silent right now. Showing the rule reading.", false],
  ] as const)("on %s: keeps the rules, shows %j, re-enabled %s (R14.6)", async (reason, message, reenabled) => {
    const p = await prepared();
    const explain = vi.fn(async (): Promise<ExplainResponse> => ({ source: "rules", reason, findings: [] }));
    render(<HouseView prepared={p} llmAvailable onBack={() => {}} explain={explain} />);
    await userEvent.click(ask()!);
    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
    expect(screen.getByTestId("haunt-score")).toHaveTextContent(new RegExp(`^${hauntScore(p.findings)} · `));
    if (reenabled) expect(ask()).toBeEnabled();
    else expect(ask()).toBeDisabled();
  });
});
