// One room of the house (haunted-house-ui R4, R9). Each room with findings is one Tab stop;
// arrows, Home and End move between its ghosts (roving tabindex, PLAN_DECISIONS.md C1.8).
import { useRef, useState, type KeyboardEvent } from "react";
import type { Finding } from "../../lib/analyzer/types";
import { roomLabel, roomStatus, type RoomModel } from "../../lib/ui/houseModel";
import { nextIndex } from "../../lib/ui/roving";
import { Ghost } from "./Ghost";

export function Room({ model, onOpen }: { model: RoomModel; onOpen: (finding: Finding, opener: HTMLButtonElement) => void }) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const label = roomLabel(model);
  const quiet = model.items.length === 0;

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = nextIndex(e.key, i, model.items.length);
    if (n === null) return; // Tab, Enter and Space keep their normal meaning
    e.preventDefault();
    setActive(n);
    buttons.current[n]?.focus();
  }

  return (
    <section
      aria-label={label}
      data-room={model.room.id}
      className={`hc-room relative flex min-h-44 flex-col rounded-md border border-aubergine-500 p-3 ${quiet ? "hc-room-quiet bg-aubergine-900" : "bg-aubergine-700"}`}
    >
      <h3 className="font-display text-xl leading-tight tracking-wide text-bone sm:text-2xl">{model.room.name}</h3>
      <p className="text-sm text-mist">{model.room.clauseType}</p>
      <p className="mt-1 text-sm font-bold text-bone" data-room-status>
        {roomStatus(model)}
      </p>
      {quiet ? (
        <svg viewBox="0 0 120 40" aria-hidden="true" focusable="false" className="mt-auto h-10 w-full text-aubergine-500">
          <path d="M4 36h112M14 36V20l8-6 8 6v16M86 36c0-6 4-10 10-10s10 4 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
        </svg>
      ) : (
        <div role="group" aria-label={label} className="mt-2 flex flex-wrap items-end gap-1">
          {model.items.map((f, i) => (
            <Ghost
              key={f.id}
              finding={f}
              room={model.room}
              tabIndex={i === active ? 0 : -1}
              onOpen={onOpen}
              onFocus={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              buttonRef={(el) => {
                buttons.current[i] = el;
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
