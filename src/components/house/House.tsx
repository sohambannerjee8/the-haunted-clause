// The house: a decorative frame and the eight rooms (haunted-house-ui R4).
import type { Finding } from "../../lib/analyzer/types";
import type { RoomModel } from "../../lib/ui/houseModel";
import { Room } from "./Room";

export function House({ model, onOpen }: { model: RoomModel[]; onOpen: (finding: Finding, opener: HTMLButtonElement) => void }) {
  return (
    <div className="relative mt-4">
      {/* Decorative roofline only; it carries no information (R4.6). */}
      <svg data-house-frame viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true" focusable="false" className="block h-12 w-full text-aubergine-500">
        <path d="M0 58 L200 4 L400 58" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M60 42 L60 18 L80 18 L80 37 M320 37 L320 18 L340 18 L340 42" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
      {/* items-start: a crowded room grows alone instead of stretching its row (C22.1). */}
      <div data-house-grid className="relative isolate grid grid-cols-2 items-start gap-2 overflow-hidden rounded-b-md border-x-2 border-b-2 border-aubergine-500 bg-aubergine-900 p-2 md:grid-cols-4">
        {/* Fog and candlelight in the frame only; behind the rooms, never over a ghost (C14.5). */}
        <div className="hc-fog -z-10" aria-hidden="true" />
        <div className="hc-candle -top-10 -left-10 -z-10" aria-hidden="true" />
        <div className="hc-candle -right-10 -bottom-10 -z-10" aria-hidden="true" />
        {model.map((m) => (
          <Room key={m.room.id} model={m} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
