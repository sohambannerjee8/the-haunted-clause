// One ghost or wisp: a button that opens the detail panel (haunted-house-ui R5).
import type { FocusEvent, KeyboardEvent, Ref } from "react";
import type { Finding, Room } from "../../lib/analyzer/types";
import { ghostLabel } from "../../lib/ui/houseModel";
import { GhostArt } from "./GhostArt";

/** A stable, non-random delay per finding, so ghosts do not move in step. */
function delayFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `-${(h % 2000) / 1000}s`;
}

export function Ghost({
  finding,
  room,
  tabIndex,
  onOpen,
  onFocus,
  onKeyDown,
  buttonRef,
}: {
  finding: Finding;
  room: Room;
  tabIndex: 0 | -1;
  onOpen: (finding: Finding, opener: HTMLButtonElement) => void;
  onFocus?: (e: FocusEvent<HTMLButtonElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const s = finding.severity;
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`hc-ghost hc-level-${s} relative inline-flex items-center justify-center rounded-full`}
      data-severity={s}
      data-finding-id={finding.id}
      aria-label={ghostLabel(finding, room)}
      tabIndex={tabIndex}
      style={{ minWidth: "44px", minHeight: "44px", animationDelay: delayFor(finding.id) }}
      onClick={(e) => onOpen(finding, e.currentTarget)}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <GhostArt severity={s} />
      <span aria-hidden="true" className="hc-numeral">
        {s}
      </span>
    </button>
  );
}
