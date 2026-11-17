// The house view's toolbar (haunted-house-ui R8.1, R10.5, R15.3, R17.4). The Lights on toggle is
// always the second control, so motion can always be stopped. Sound is third and off by default (R11.2).
import type { ReactNode } from "react";

const BUTTON = "min-h-11 rounded-md border-2 px-4 py-2 hover:bg-aubergine-700";

export function Toolbar({
  company,
  onBack,
  lightsOn,
  onToggleLights,
  soundOn,
  onToggleSound,
  children,
}: {
  company: string | null;
  onBack: () => void;
  lightsOn?: boolean;
  onToggleLights?: () => void;
  soundOn?: boolean;
  onToggleSound?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      <button type="button" onClick={onBack} className={`${BUTTON} border-mist text-bone`}>
        Read another policy
      </button>
      {onToggleLights && (
        <button
          type="button"
          aria-pressed={lightsOn ? "true" : "false"}
          onClick={onToggleLights}
          className={`${BUTTON} ${lightsOn ? "border-bone bg-bone text-ink hover:bg-bone" : "border-candle text-candle"}`}
        >
          Lights on
        </button>
      )}
      {onToggleSound && (
        <button
          type="button"
          aria-pressed={soundOn ? "true" : "false"}
          onClick={onToggleSound}
          className={`${BUTTON} ${soundOn ? "border-bone bg-bone text-ink hover:bg-bone" : "border-mist text-bone"}`}
        >
          Sound
        </button>
      )}
      {children}
      {company && <p className="text-mist">Sample: {company} (a fictional company)</p>}
    </div>
  );
}
