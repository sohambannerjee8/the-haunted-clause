// Inline SVG ghosts, drawn for this project. Size, opacity and colour come from the level's CSS
// custom properties (design-language.md); the shape also rises with severity (PLAN_DECISIONS.md C14.3):
// 0 a wisp, 1 a faint ghost, 2 an uneasy ghost, 3 a tattered ghost with glowing eyes.
import type { Severity } from "../../lib/analyzer/types";

const INK = "#0d0a10";

/** Level 1: a soft, rounded sheet with a smooth hem, small calm eyes. */
const FAINT = "M32 8C21 8 14 16 14 28v24c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0V28C50 16 43 8 32 8Z";
/** Level 2: a wavier hem and a leaning body. */
const UNEASY = "M33 6C20 6 12 15 12 28v26l5-4 5 4 5-5 5 5 5-5 5 5 5-4 5 3V28C54 15 46 6 33 6Z";
/** Level 3: a tall sheet with a torn, jagged hem. */
const TATTERED = "M32 3C18 3 9 13 9 28v31l4-7 3 6 4-9 4 8 3-6 5 9 3-7 4 8 4-9 3 6 5-8 2 7V28C55 13 46 3 32 3Z";
/** Level 0: a curl of mist. */
const WISP = "M33 8c-9 0-15 7-15 15 0 7 4 11 9 13-3 3-7 4-11 4 6 5 15 4 20-2 6-5 9-12 9-18 0-7-5-12-12-12Z";

const SHAPE = ["wisp", "faint", "uneasy", "tattered"] as const;

export function GhostArt({ severity }: { severity: Severity }) {
  const style = {
    width: "var(--ghost-size)",
    height: "var(--ghost-size)",
    opacity: "var(--ghost-opacity)",
    color: "var(--ghost-colour)",
  };
  const common = { viewBox: "0 0 64 64", "aria-hidden": true, focusable: false, className: "hc-art", style, "data-shape": SHAPE[severity] } as const;

  if (severity === 0) {
    return (
      <svg {...common}>
        <path d={WISP} fill="currentColor" />
        <path d="M22 50c4 2 9 2 13 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }
  if (severity === 1) {
    return (
      <svg {...common}>
        <path d={FAINT} fill="currentColor" />
        <circle cx="26" cy="27" r="2.5" fill={INK} />
        <circle cx="38" cy="27" r="2.5" fill={INK} />
      </svg>
    );
  }
  if (severity === 2) {
    return (
      <svg {...common}>
        <path d={UNEASY} fill="currentColor" />
        {/* Worried brows and a wobbling mouth. */}
        <path d="M21 20l7 3M45 20l-7 3" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="26" cy="28" rx="3.5" ry="4.5" fill={INK} />
        <ellipse cx="40" cy="28" rx="3.5" ry="4.5" fill={INK} />
        <path d="M25 41c2.5-2 5-2 7.5 0s5 2 7.5 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d={TATTERED} fill="currentColor" className="hc-glow" />
      <path d={TATTERED} fill="currentColor" />
      {/* Hollow sockets with glowing eyes, and a gaping mouth. */}
      <ellipse cx="24" cy="26" rx="5.5" ry="7" fill={INK} />
      <ellipse cx="40" cy="26" rx="5.5" ry="7" fill={INK} />
      <circle cx="24" cy="27" r="2.6" fill="currentColor" className="hc-eye-glow" />
      <circle cx="40" cy="27" r="2.6" fill="currentColor" className="hc-eye-glow" />
      <ellipse cx="32" cy="43" rx="5" ry="6.5" fill={INK} />
    </svg>
  );
}
