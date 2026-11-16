// The three fictional sample policies (clause-analyzer R11). Imports only the text modules and meta.ts (R7.4).
import { average } from "./average";
import { SAMPLE_META, type SampleId } from "./meta";
import { mild } from "./mild";
import { terrible } from "./terrible";

export interface Sample {
  readonly id: SampleId;
  readonly company: string;
  readonly title: string;
  readonly text: string;
}

export const SAMPLES: readonly Sample[] = [mild, average, terrible];
export { SAMPLE_META };
export type { SampleId };
