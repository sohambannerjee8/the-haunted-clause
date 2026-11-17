// The input screen's paste box (haunted-house-ui R2, R16.1, R16.6).
import type { ClipboardEvent } from "react";

export const MAX_CHARS = 50_000;
export type InputNotice = "empty" | "cut" | "too-long";

const fmt = new Intl.NumberFormat("en");

export function InputScreen({
  text,
  notice,
  onChange,
  onAnalyze,
}: {
  text: string;
  notice?: InputNotice;
  onChange: (text: string, notice?: InputNotice) => void;
  onAnalyze: () => void;
}) {
  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData("text");
    const el = e.currentTarget;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + pasted + text.slice(end);
    if (next.length <= MAX_CHARS) return; // the browser inserts it
    e.preventDefault();
    onChange(next.slice(0, MAX_CHARS), "cut"); // R2.3: keep the first 50,000 characters
  }

  const empty = notice === "empty";
  return (
    <section aria-labelledby="read-heading">
      <h2 id="read-heading" className="font-display text-3xl tracking-wide text-bone">
        Read a policy
      </h2>
      <label htmlFor="policy-text" className="mt-3 block font-bold text-bone">
        Paste a Terms & Conditions or privacy policy
      </label>
      <textarea
        id="policy-text"
        value={text}
        maxLength={MAX_CHARS}
        rows={10}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        aria-invalid={empty ? true : undefined}
        aria-describedby={empty ? "policy-count policy-error" : "policy-count"}
        className="mt-2 block w-full resize-y rounded-md border-2 border-mist bg-aubergine-900 p-3 text-bone placeholder:text-mist"
      />
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <p id="policy-count" aria-live="off" className="text-mist">
          {fmt.format(text.length)} / {fmt.format(MAX_CHARS)} characters
        </p>
        <button
          type="button"
          onClick={onAnalyze}
          className="min-h-11 rounded-md bg-candle px-6 py-2 font-bold text-ink hover:brightness-110"
        >
          Analyze
        </button>
      </div>
      {empty && (
        <p id="policy-error" className="mt-2 font-bold text-candle">
          Paste a policy or pick a sample first.
        </p>
      )}
      {notice === "too-long" && <p className="mt-2 font-bold text-candle">That text is longer than 50,000 characters.</p>}
      <div role="status" className="mt-2 text-candle">
        {notice === "cut" ? "Your text was cut at 50,000 characters." : ""}
      </div>
    </section>
  );
}
