// "Ask the medium" for pasted text (haunted-house-ui R14). The call happens only from the button's
// click handler: no effect or timer can send it (R14.7).
import type { Reason } from "../../lib/llm/schema";
import { GEMINI_TERMS_URL, OPT_IN_NOTICE } from "../../lib/llm/privacy";

export type Medium = "idle" | "listening" | "spoken" | { failed: Reason };

export function failureMessage(reason: Reason): string {
  if (reason === "rate-limited") return "The medium needs a rest. Try again in a minute.";
  if (reason === "timeout") return "The medium took too long. Showing the rule reading.";
  return "The medium is silent right now. Showing the rule reading.";
}

export function OptInPanel({ medium, onAsk }: { medium: Medium; onAsk: () => void }) {
  const failed = typeof medium === "object" ? medium.failed : null;
  const disabled = medium === "listening" || failed === "no-key";
  const status =
    medium === "listening" ? "The medium is listening…" : medium === "spoken" ? "The medium has spoken." : failed ? failureMessage(failed) : "";
  return (
    <section aria-label="Ask the medium" className="mt-4 rounded-md border border-candle bg-aubergine-900 p-4">
      {medium !== "spoken" && (
        <>
          <p>{OPT_IN_NOTICE}</p>
          <p className="mt-1">
            <a href={GEMINI_TERMS_URL} className="text-candle underline" rel="noopener noreferrer" target="_blank">
              Google&apos;s Gemini API terms
            </a>
          </p>
          <button
            type="button"
            onClick={onAsk}
            disabled={disabled}
            className="mt-3 min-h-11 rounded-md bg-candle px-6 py-2 font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ask the medium
          </button>
        </>
      )}
      <p role="status" className="mt-2 font-bold text-bone">
        {status}
      </p>
    </section>
  );
}
