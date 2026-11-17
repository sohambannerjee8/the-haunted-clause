"use client";
// The house view, loaded with a dynamic import on first use (haunted-house-ui R17.1).
import { useEffect, useRef, useState } from "react";
import { hauntScore } from "../../lib/analyzer/score";
import type { Finding } from "../../lib/analyzer/types";
import type { ExplainedFinding } from "../../lib/llm/merge";
import { roomById } from "../../lib/analyzer/rooms";
import { buildHouseModel } from "../../lib/ui/houseModel";
import { createSound } from "../../lib/ui/sound";
import { DetailDialog } from "./DetailDialog";
import { House } from "./House";
import type { Prepared } from "./prepare";
import { ScoreBadge } from "./ScoreBadge";
import { Toolbar } from "./Toolbar";

export { prepare } from "./prepare";
export type { Prepared, PrepareResult, Source } from "./prepare";

export interface HouseViewProps {
  prepared: Prepared;
  llmAvailable: boolean;
  onBack: () => void;
}

export function HouseView({ prepared, onBack }: HouseViewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [findings] = useState<readonly ExplainedFinding[]>(prepared.findings);
  const [open, setOpen] = useState<{ finding: Finding; opener: HTMLButtonElement } | null>(null);
  // Sound is off until the user turns it on; no AudioContext exists before that (R11.1).
  const [sound] = useState(() => createSound());
  useEffect(() => heading.current?.focus(), []);

  const model = buildHouseModel(findings);
  const score = hauntScore(findings);

  return (
    <div>
      <Toolbar company={prepared.company} onBack={onBack} />
      <ScoreBadge score={score} />
      <h2 ref={heading} tabIndex={-1} className="mt-6 font-display text-3xl tracking-wide">
        Inside the house
      </h2>
      <House model={model} onOpen={(finding, opener) => setOpen({ finding, opener })} />
      {open && (() => {
        const shown = findings.find((f) => f.id === open.finding.id)!;
        const rule = prepared.ruleFindings.find((f) => f.id === shown.id)!;
        return (
          <DetailDialog
            key={shown.id}
            finding={shown}
            ruleSeverity={rule.severity}
            room={roomById(shown.room)}
            opener={open.opener}
            onClose={() => setOpen(null)}
            onShown={(severity) => sound.play(severity)}
          />
        );
      })()}
    </div>
  );
}
