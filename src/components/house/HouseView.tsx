"use client";
// The house view, loaded with a dynamic import on first use (haunted-house-ui R17.1).
import { useEffect, useRef } from "react";
import type { Prepared } from "./prepare";

export { prepare } from "./prepare";
export type { Prepared, PrepareResult, Source } from "./prepare";

export interface HouseViewProps {
  prepared: Prepared;
  llmAvailable: boolean;
  onBack: () => void;
}

export function HouseView({ prepared, onBack }: HouseViewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 py-4">
        <button type="button" onClick={onBack} className="min-h-11 rounded-md border-2 border-mist px-4 py-2 text-bone">
          Read another policy
        </button>
      </div>
      <h2 ref={heading} tabIndex={-1} className="font-display text-3xl tracking-wide">
        Inside the house
      </h2>
      <p className="text-mist">{prepared.findings.length} findings</p>
    </div>
  );
}
