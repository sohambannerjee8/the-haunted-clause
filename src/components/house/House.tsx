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
      <div data-house-grid className="grid grid-cols-2 gap-2 rounded-b-md border-x-2 border-b-2 border-aubergine-500 bg-aubergine-900 p-2 md:grid-cols-4">
        {model.map((m) => (
          <Room key={m.room.id} model={m} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
