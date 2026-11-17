// One small drawn prop per room, so the room can be recognised at a glance (PLAN_DECISIONS.md C14.2).
// It repeats the room's identity, which the heading also gives, so it is hidden from assistive technology.
import type { ReactNode } from "react";
import type { RoomId } from "../../lib/analyzer/types";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const PROPS: Record<RoomId, ReactNode> = {
  // Cellar: two barrels.
  cellar: (
    <g {...S}>
      <ellipse cx="14" cy="10" rx="9" ry="3" />
      <path d="M5 10v18c0 2 4 3 9 3s9-1 9-3V10M5 16c0 2 4 3 9 3s9-1 9-3M5 23c0 2 4 3 9 3s9-1 9-3" />
      <ellipse cx="34" cy="14" rx="8" ry="2.5" />
      <path d="M26 14v15c0 2 4 3 8 3s8-1 8-3V14M26 21c0 2 4 3 8 3s8-1 8-3" />
    </g>
  ),
  // Watching Portraits: two frames with eyes.
  portraits: (
    <g {...S}>
      <rect x="3" y="5" width="18" height="24" rx="1" />
      <rect x="27" y="8" width="16" height="20" rx="1" />
      <circle cx="9" cy="15" r="1.6" fill="currentColor" />
      <circle cx="15" cy="15" r="1.6" fill="currentColor" />
      <circle cx="32" cy="16" r="1.4" fill="currentColor" />
      <circle cx="38" cy="16" r="1.4" fill="currentColor" />
    </g>
  ),
  // Coin Vault: a round vault door with a wheel.
  vault: (
    <g {...S}>
      <circle cx="23" cy="18" r="14" />
      <circle cx="23" cy="18" r="5" />
      <path d="M23 7v6M23 23v6M12 18h6M28 18h6" />
      <circle cx="39" cy="30" r="3" />
    </g>
  ),
  // Locked Door: a door with crossed chains and a padlock.
  "locked-door": (
    <g {...S}>
      <path d="M10 33V7h24v26" />
      <path d="M10 10l24 18M34 10L10 28" strokeDasharray="3 2" />
      <rect x="18" y="16" width="8" height="7" rx="1" fill="currentColor" />
      <path d="M19.5 16v-2a2.5 2.5 0 015 0v2" />
    </g>
  ),
  // Silent Court: a gavel on its block.
  court: (
    <g {...S}>
      <rect x="9" y="7" width="16" height="8" rx="2" transform="rotate(-30 17 11)" />
      <path d="M20 16l12 12" />
      <path d="M6 31h20" />
      <rect x="9" y="27" width="14" height="4" rx="1" />
    </g>
  ),
  // Mirror Room: an oval mirror with a crack.
  mirror: (
    <g {...S}>
      <ellipse cx="23" cy="17" rx="11" ry="14" />
      <path d="M19 6l4 8-5 4 7 5-3 7" />
      <path d="M17 31l-3 3M29 31l3 3" />
    </g>
  ),
  // Trapdoor: a floor hatch hanging open over a dark gap.
  trapdoor: (
    <g {...S}>
      <path d="M4 26h40" />
      <path d="M12 26h20l-4 6H16z" fill="currentColor" fillOpacity="0.35" />
      <path d="M12 26l6-16h20l-6 16" />
      <circle cx="27" cy="16" r="1.5" fill="currentColor" />
    </g>
  ),
  // Shifting Stairs: crooked steps.
  stairs: (
    <g {...S}>
      <path d="M4 32h8l1-6h8l-1-6h9l1-6h8l-1-6h6" />
      <path d="M12 32v-6M21 26l-1-6M29 20l2-6M39 14l-1-6" />
    </g>
  ),
};

export function RoomProp({ room }: { room: RoomId }) {
  return (
    <svg data-prop={room} viewBox="0 0 46 36" aria-hidden="true" focusable="false" className="h-7 w-8 shrink-0 text-mist sm:h-9 sm:w-11">
      {PROPS[room]}
    </svg>
  );
}
