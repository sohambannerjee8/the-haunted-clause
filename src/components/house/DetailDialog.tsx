// The ghost detail panel: a native modal <dialog> (haunted-house-ui R6, R13.1).
// Every text is a React text child; nothing is rendered as HTML (R6.5).
import { useEffect, useId, useRef } from "react";
import type { Room, Severity } from "../../lib/analyzer/types";
import type { ExplainedFinding } from "../../lib/llm/merge";
import { severityLabel } from "../../lib/ui/houseModel";

const SEVERITY_CLASS = ["text-wisp border-wisp", "text-candle border-candle", "text-ember border-ember", "text-venom border-venom"];

export function DetailDialog({
  finding,
  ruleSeverity,
  room,
  opener,
  onClose,
  onShown,
}: {
  finding: ExplainedFinding;
  ruleSeverity: Severity;
  room: Room;
  opener: HTMLElement | null;
  onClose: () => void;
  onShown?: (severity: Severity) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.hasAttribute("open")) dialog.showModal(); // focus stays inside; the page is inert (R6.7)
    onShown?.(finding.severity);
    const handleClose = () => {
      onClose();
      opener?.focus(); // R6.6
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
    // Opens once per mount; the parent remounts it for each finding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = finding.severity;
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="hc-dialog m-auto rounded-lg border-2 border-aubergine-500 bg-aubergine-900 p-5 text-bone backdrop:bg-ink/80"
    >
      <h2 id={titleId} className="font-display text-3xl tracking-wide">
        {room.name}
      </h2>
      <p className="mt-2 flex items-center gap-2">
        <span className={`inline-flex min-w-8 justify-center rounded-full border-2 px-2 font-bold ${SEVERITY_CLASS[s]}`}>{s}</span>
        <span className="font-bold">{severityLabel(s)}</span>
      </p>

      <h3 className="mt-4 font-bold text-mist">The clause</h3>
      <blockquote className="hc-quote mt-1 border-l-4 border-aubergine-500 bg-ink/60 p-3">{finding.quote}</blockquote>

      <p className="mt-4">{finding.explanation}</p>
      <h3 className="mt-4 font-bold text-mist">Why it matters</h3>
      <p className="mt-1">{finding.whyItMatters}</p>

      {finding.mitigationId && <p className="mt-3 text-mist">A reassurance in this clause lowers its severity.</p>}
      {finding.cancelledMitigationId && <p className="mt-3 text-mist">This clause starts with a reassurance, then adds an exception.</p>}
      {s > ruleSeverity && (
        <p className="mt-3 text-mist">
          The medium raised this from {ruleSeverity} to {s}.
        </p>
      )}

      <p className="mt-4">
        <span className="rounded border border-mist px-2 py-0.5 text-sm text-bone">{finding.source === "llm" ? "Medium's reading" : "Rule reading"}</span>
      </p>
      <p className="mt-4 text-sm text-mist">
        <strong className="text-bone">Not legal advice.</strong> The readings are automated and can be wrong.
      </p>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={() => ref.current?.close()} className="min-h-11 rounded-md bg-candle px-6 py-2 font-bold text-ink">
          Close
        </button>
      </div>
    </dialog>
  );
}
