// Plain-English explanations for a first-time visitor (PLAN_DECISIONS.md C25). One source for the
// components and their tests.
import { severityLabel } from "./houseModel";

export const INPUT_NOTE =
  "Your text is read in your browser and never stored. The app finds risky clauses and files each one in a room of the house.";
export const GHOST_LEGEND = `Each ghost is one clause. ${([0, 1, 2, 3] as const).map((s) => `${s} ${severityLabel(s).toLowerCase()}`).join(" · ")}.`;
export const QUIET_NOTE = "Quiet means no risky clause of this kind was found. It doesn't prove the policy is safe.";
export const MEDIUM_INTRO = "The medium is an AI that rewrites these readings in plainer words.";
export const SOURCE_EXPLANATION = { rules: "From the app's built-in rules", llm: "Rewritten by the AI medium" } as const;
export const SCORE_MARKER = "(this policy)";
export const REPO_URL = "https://github.com/sohambannerjee8/the-haunted-clause";
