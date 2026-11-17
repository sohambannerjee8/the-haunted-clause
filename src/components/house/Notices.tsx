// Notices above the house (haunted-house-ui R14.1, R14.2, R16.3–R16.5).
import type { RoomModel } from "../../lib/ui/houseModel";
import { OptInPanel, type Medium } from "./OptInPanel";

export const NO_MEDIUM = "These readings come from built-in rules. No medium is configured on this site.";
export const NON_ENGLISH = "This app reads English only. Results for other languages may be missing or wrong.";
export const NO_GHOSTS = "No ghosts here. None of the clauses matched a risky pattern, but that does not make the policy safe.";
export const ONLY_WISPS = "Only calm wisps here.";

export function Notices({
  llmAvailable,
  pasted,
  likelyNonEnglish,
  model,
  medium,
  onAsk,
}: {
  llmAvailable: boolean;
  pasted: boolean;
  likelyNonEnglish: boolean;
  model: RoomModel[];
  medium: Medium;
  onAsk: () => void;
}) {
  const items = model.flatMap((m) => m.items);
  const onlyWisps = items.length > 0 && items.every((f) => f.severity === 0);
  return (
    <div className="mt-4 space-y-2">
      {likelyNonEnglish && <p className="rounded-md border border-candle p-3 font-bold">{NON_ENGLISH}</p>}
      {items.length === 0 && <p className="rounded-md border border-mist p-3">{NO_GHOSTS}</p>}
      {onlyWisps && <p className="rounded-md border border-mist p-3">{ONLY_WISPS}</p>}
      {llmAvailable && pasted && items.length > 0 && <OptInPanel medium={medium} onAsk={onAsk} />}
      {!llmAvailable && <p className="text-mist">{NO_MEDIUM}</p>}
    </div>
  );
}
