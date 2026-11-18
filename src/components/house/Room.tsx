// One room of the house (haunted-house-ui R4, R9). Each room with findings is one Tab stop;
// arrows, Home and End move between its ghosts (roving tabindex, PLAN_DECISIONS.md C1.8).
// A room with more than 12 findings draws its 12 most severe and a "+N more" button, which is the
// last stop in the room's roving set and expands the room in place (C22.2, C22.3).
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Finding } from "../../lib/analyzer/types";
import { capRoom, roomLabel, roomStatus, type RoomModel } from "../../lib/ui/houseModel";
import { nextIndex } from "../../lib/ui/roving";
import { Ghost } from "./Ghost";
import { RoomProp } from "./RoomProp";

export function Room({ model, onOpen }: { model: RoomModel; onOpen: (finding: Finding, opener: HTMLButtonElement) => void }) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const groupId = useId();
  const label = roomLabel(model);
  const quiet = model.items.length === 0;

  const capped = capRoom(model.items);
  const hasToggle = capped.hidden > 0;
  const shown = expanded ? model.items : capped.shown;
  const toggleIndex = shown.length; // the button comes after the ghosts in the roving set
  const stops = shown.length + (hasToggle ? 1 : 0);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = nextIndex(e.key, i, stops);
    if (n === null) return; // Tab, Enter and Space keep their normal meaning
    e.preventDefault();
    setActive(n);
    buttons.current[n]?.focus();
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    // The button keeps focus and stays the room's Tab stop; its index moves with the ghost count.
    setActive(next ? model.items.length : capped.shown.length);
  }

  return (
    <section
      aria-label={label}
      data-room={model.room.id}
      className={`hc-room relative flex min-h-44 flex-col rounded-md border border-aubergine-500 p-3 ${quiet ? "hc-room-quiet bg-aubergine-900" : "bg-aubergine-700"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-xl leading-tight tracking-wide text-bone sm:text-2xl">{model.room.name}</h3>
        <RoomProp room={model.room.id} />
      </div>
      <p className="text-sm text-mist">{model.room.clauseType}</p>
      <p className="mt-1 text-sm font-bold text-bone" data-room-status>
        {roomStatus(model)}
      </p>
      {quiet ? (
        <svg viewBox="0 0 120 40" aria-hidden="true" focusable="false" className="mt-auto h-10 w-full text-aubergine-500">
          <path d="M4 36h112M14 36V20l8-6 8 6v16M86 36c0-6 4-10 10-10s10 4 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
        </svg>
      ) : (
        <>
          <div id={groupId} role="group" aria-label={label} className="mt-2 flex flex-wrap items-end gap-1">
            {shown.map((f, i) => (
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
          {hasToggle && (
            <button
              ref={(el) => {
                buttons.current[toggleIndex] = el;
              }}
              type="button"
              data-room-toggle
              aria-expanded={expanded ? "true" : "false"}
              aria-controls={groupId}
              aria-label={expanded ? `Show fewer ghosts in ${model.room.name}` : `+${capped.hidden} more ghosts in ${model.room.name}`}
              tabIndex={active === toggleIndex ? 0 : -1}
              onClick={toggle}
              onFocus={() => setActive(toggleIndex)}
              onKeyDown={(e) => onKeyDown(e, toggleIndex)}
              className="mt-2 min-h-11 min-w-11 self-start rounded-md border-2 border-candle px-3 py-1 text-sm font-bold text-candle hover:bg-aubergine-900"
            >
              {expanded ? "Show fewer" : `+${capped.hidden} more`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
