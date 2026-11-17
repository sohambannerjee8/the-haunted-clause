// The Haunt Score as "<score> · <band>", never "/100" (haunted-house-ui R7).
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
    <div className="flex items-baseline gap-3">
      <span className="text-mist">Haunt Score</span>
      <span data-testid="haunt-score" className="text-4xl font-bold text-bone">
        {score} · <span className="font-display tracking-wide">{band}</span>
      </span>
      <span role="status" className="sr-only-live">
        {announced}
      </span>
    </div>
  );
}
