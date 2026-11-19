// Lights on mode: the same findings as a plain semantic list (haunted-house-ui R8, R13.1).
// No ghost art, no animation, no decorative images (R8.4).
import { hauntScore } from "../../lib/analyzer/score";
import type { ExplainedFinding } from "../../lib/llm/merge";
import { severityLabel, type RoomModel } from "../../lib/ui/houseModel";
import { HouseLegend } from "./HouseLegend";
import { ScoreScale } from "./ScoreScale";

export function LightsOnList({ model }: { model: RoomModel<ExplainedFinding>[] }) {
  // The same score as the house view: hauntScore of the findings shown (R7.2).
  const score = hauntScore(model.flatMap((m) => m.items));
  return (
    <div className="mt-4">
      <p className="rounded-md border border-mist p-3">
        <strong>Not legal advice.</strong> The readings are automated and can be wrong.
      </p>
      <ScoreScale score={score} className="mt-3" />
      <HouseLegend className="mt-2" />
      {model.map((m) => {
        const headingId = `lights-${m.room.id}`;
        return (
          <section key={m.room.id} aria-labelledby={headingId} className="mt-6">
            <h3 id={headingId} className="text-2xl font-bold">
              {m.room.name}
            </h3>
            <p className="text-mist">{m.room.clauseType}</p>
            {m.items.length === 0 ? (
              <p className="mt-2 font-bold">Quiet</p>
            ) : (
              <ol className="mt-2 space-y-4">
                {m.items.map((f) => (
                  <li key={f.id} data-finding-id={f.id} data-severity={f.severity} className="border-l-4 border-mist pl-3">
                    <p className="font-bold">
                      Severity {f.severity}: <span>{severityLabel(f.severity)}</span>
                    </p>
                    <blockquote className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{f.quote}</blockquote>
                    <p className="mt-1">{f.explanation}</p>
                    <p className="mt-1">
                      <strong>Why it matters: </strong>
                      <span>{f.whyItMatters}</span>
                    </p>
                    {f.mitigationId && <p className="mt-1">A reassurance in this clause lowers its severity.</p>}
                    <p className="mt-1 text-sm">
                      <span>{f.source === "llm" ? "Medium's reading" : "Rule reading"}</span>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
