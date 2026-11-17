// Inline SVG art for ghosts (levels 1–3) and wisps (level 0), drawn for this project.
// Size, opacity and colour come from the level's CSS custom properties (design-language.md).
import type { Severity } from "../../lib/analyzer/types";

const GHOST =
  "M32 5C19 5 11 15 11 29v27l5.5-4.5L22 56l5-4.5 5 4.5 5-4.5 5 4.5 5.5-4.5L53 56V29C53 15 45 5 32 5Z";
const WISP = "M33 8c-9 0-15 7-15 15 0 7 4 11 9 13-3 3-7 4-11 4 6 5 15 4 20-2 6-5 9-12 9-18 0-7-5-12-12-12Z";

export function GhostArt({ severity }: { severity: Severity }) {
  const style = {
    width: "var(--ghost-size)",
    height: "var(--ghost-size)",
    opacity: "var(--ghost-opacity)",
    color: "var(--ghost-colour)",
  };
  if (severity === 0) {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="hc-art" style={style}>
        <path d={WISP} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="hc-art" style={style}>
      {severity === 3 && <path d={GHOST} fill="currentColor" className="hc-glow" />}
      <path d={GHOST} fill="currentColor" />
      <ellipse cx="25" cy="27" rx="3.5" ry={severity === 3 ? 5.5 : 4.5} fill="#0d0a10" />
      <ellipse cx="39" cy="27" rx="3.5" ry={severity === 3 ? 5.5 : 4.5} fill="#0d0a10" />
      {severity >= 2 && <ellipse cx="32" cy="40" rx={severity === 3 ? 5 : 3.5} ry={severity === 3 ? 6 : 3} fill="#0d0a10" />}
    </svg>
  );
}
