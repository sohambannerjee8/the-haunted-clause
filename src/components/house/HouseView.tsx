"use client";
// The house view, loaded with a dynamic import on first use (haunted-house-ui R17.1).
import { useEffect, useRef, useState } from "react";
import { hauntScore } from "../../lib/analyzer/score";
import type { Finding } from "../../lib/analyzer/types";
import type { ExplainedFinding } from "../../lib/llm/merge";
import { buildHouseModel } from "../../lib/ui/houseModel";
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
  const [, setOpen] = useState<{ finding: Finding; opener: HTMLButtonElement } | null>(null);
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
    </div>
  );
}
