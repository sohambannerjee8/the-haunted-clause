// The score scale line under the Haunt Score panel and at the top of Lights on mode
// (haunted-house-ui R7.4, R8.6; PLAN_DECISIONS.md C24, C25.2). The current band is bold, aria-current
// and followed by the visible text "(this policy)", so the highlight is not colour alone. Never "/100": the highest reachable score is 97.
import { SCORE_MARKER } from "../../lib/ui/copy";
import { BANDS, bandFor } from "../../lib/ui/houseModel";

const RANGES: Record<(typeof BANDS)[number], string> = {
  "Mostly quiet": "0–24",
  Uneasy: "25–49",
  Haunted: "50–74",
  Run: "75+",
};
const LEAD = "Scores run from 0 to 97, the most haunted a policy can be: ";

export const SCALE_TEXT = `${LEAD}${BANDS.map((b) => `${RANGES[b]} ${b}`).join(" · ")}.`;

export function ScoreScale({ score, className = "" }: { score: number; className?: string }) {
  const current = bandFor(score);
  return (
    <p data-testid="score-scale" className={`text-base text-mist ${className}`}>
      {LEAD}
      {BANDS.map((b, i) => (
        <span key={b}>
          {i > 0 && " · "}
          {b === current ? (
            <>
              <strong aria-current="true" className="font-bold text-bone">
                {`${RANGES[b]} ${b}`}
              </strong>
              <span className="text-bone">{` ${SCORE_MARKER}`}</span>
            </>
          ) : (
            `${RANGES[b]} ${b}`
          )}
        </span>
      ))}
      .
    </p>
  );
}
