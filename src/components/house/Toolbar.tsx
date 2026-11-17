// The house view's toolbar (haunted-house-ui R15.3, R17.4). Lights on and Sound come in Tasks 28 and 30.
import type { ReactNode } from "react";

export function Toolbar({ company, onBack, children }: { company: string | null; onBack: () => void; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      <button type="button" onClick={onBack} className="min-h-11 rounded-md border-2 border-mist px-4 py-2 text-bone hover:bg-aubergine-700">
        Read another policy
      </button>
      {children}
      {company && <p className="text-mist">Sample: {company} (a fictional company)</p>}
    </div>
  );
}
