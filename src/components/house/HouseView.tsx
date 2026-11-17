"use client";
// The house view, loaded with a dynamic import on first use (haunted-house-ui R17.1).
import { useEffect, useRef, useState } from "react";
import { roomById } from "../../lib/analyzer/rooms";
import { hauntScore } from "../../lib/analyzer/score";
import type { Finding } from "../../lib/analyzer/types";
import { requestExplanations } from "../../lib/llm/client";
import { mergeFindings, type ExplainedFinding } from "../../lib/llm/merge";
import type { ExplainResponse } from "../../lib/llm/schema";
import { buildHouseModel } from "../../lib/ui/houseModel";
import { createSound } from "../../lib/ui/sound";
import { DetailDialog } from "./DetailDialog";
import { House } from "./House";
import { LightsOnList } from "./LightsOnList";
import { Notices } from "./Notices";
import type { Medium } from "./OptInPanel";
import type { Prepared } from "./prepare";
import { ScoreBadge } from "./ScoreBadge";
import { Toolbar } from "./Toolbar";

export { prepare } from "./prepare";
export type { Prepared, PrepareResult, Source } from "./prepare";

export interface HouseViewProps {
  prepared: Prepared;
  llmAvailable: boolean;
  onBack: () => void;
  /** The llm-explainer client; replaced in tests. */
  explain?: (findings: readonly Finding[]) => Promise<ExplainResponse>;
}

export function HouseView({ prepared, llmAvailable, onBack, explain = requestExplanations }: HouseViewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [findings, setFindings] = useState<readonly ExplainedFinding[]>(prepared.findings);
  const [lights, setLights] = useState(false);
  const [medium, setMedium] = useState<Medium>("idle");
  const [open, setOpen] = useState<{ finding: Finding; opener: HTMLButtonElement } | null>(null);
  // Sound is off until the user turns it on; no AudioContext exists before that (R11.1).
  const [sound] = useState(() => createSound());
  useEffect(() => heading.current?.focus(), []);

  const model = buildHouseModel(findings);
  const score = hauntScore(findings); // always the findings shown, including raised severities (R7.2)

  // Called only from the "Ask the medium" button (R14.4, R14.7).
  async function askMedium() {
    setMedium("listening");
    const result = await explain(prepared.ruleFindings);
    if (result.source === "llm") {
      setFindings(mergeFindings(prepared.ruleFindings, result.findings));
      setMedium("spoken");
    } else {
      setMedium({ failed: result.reason });
    }
  }

  return (
    <div>
      <Toolbar company={prepared.company} onBack={onBack} lightsOn={lights} onToggleLights={() => setLights((v) => !v)} />
      <ScoreBadge score={score} />
      <Notices
        llmAvailable={llmAvailable}
        pasted={prepared.source.kind === "pasted"}
        likelyNonEnglish={prepared.result.likelyNonEnglish}
        model={model}
        medium={medium}
        onAsk={() => void askMedium()}
      />
      <h2 ref={heading} tabIndex={-1} className="mt-6 font-display text-3xl tracking-wide">
        {lights ? "Lights on" : "Inside the house"}
      </h2>
      {/* Lights on renders no ghost, so every repeating animation stops (R10.5). */}
      {lights ? <LightsOnList model={model} /> : <House model={model} onOpen={(finding, opener) => setOpen({ finding, opener })} />}
      {open &&
        (() => {
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
