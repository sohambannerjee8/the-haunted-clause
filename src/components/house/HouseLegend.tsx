// The ghost legend and what "Quiet" means, above the house and at the top of Lights on mode
// (haunted-house-ui R4.9, R8.6; PLAN_DECISIONS.md C25.3, C25.4). Text only, no art.
import { GHOST_LEGEND, QUIET_NOTE } from "../../lib/ui/copy";

export function HouseLegend({ className = "" }: { className?: string }) {
  return (
    <div data-testid="house-legend" className={`text-base text-mist ${className}`}>
      <p>{GHOST_LEGEND}</p>
      <p className="mt-1">{QUIET_NOTE}</p>
    </div>
  );
}
