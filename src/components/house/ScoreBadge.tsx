// The Haunt Score as the hero (PLAN_DECISIONS.md C14.4): the band is the main phrase, the number
// beside it. The text stays "<score> · <band>", never "/100" (haunted-house-ui R7).
import { useEffect, useState } from "react";
import { bandFor } from "../../lib/ui/houseModel";

export function ScoreBadge({ score }: { score: number }) {
  const band = bandFor(score);
  const message = `Haunt Score ${score}, ${band}`;
  const [announced, setAnnounced] = useState("");
  // Fill the live region shortly after a change, so it is announced once per new score (R7.3).
  useEffect(() => {
    const t = setTimeout(() => setAnnounced(message), 100);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div data-score-hero className="hc-score-hero mt-2 rounded-lg border border-aubergine-500 px-4 py-5 text-center">
      <p className="text-sm font-bold tracking-widest text-mist uppercase">Haunt Score</p>
      <p data-testid="haunt-score" className="mt-1 flex flex-wrap items-baseline justify-center gap-x-1 text-bone">
        <span data-testid="haunt-number" className="hc-score-number text-4xl font-bold sm:text-5xl">
          {score}
        </span>
        <span className="text-3xl whitespace-pre text-mist">{" · "}</span>
        <span data-testid="haunt-band" className="hc-score-band font-display text-6xl leading-none tracking-wide sm:text-8xl">
          {band}
        </span>
      </p>
      <span role="status" className="sr-only-live">
        {announced}
      </span>
    </div>
  );
}
