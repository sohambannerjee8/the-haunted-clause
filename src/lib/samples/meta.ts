// Sample IDs, company names and one-line descriptions for the input screen.
// Imports nothing, so the first screen can load it without the policy texts (clause-analyzer R7.4).
export const SAMPLE_META = [
  { id: "mild", company: "Quillwhisper Notes", blurb: "A note-taking app with mostly fair terms." },
  { id: "average", company: "Mirebell Streaming", blurb: "A streaming service with a few sharp corners." },
  { id: "terrible", company: "Murkwillow Social", blurb: "A social network that wants everything you have." },
] as const;

export type SampleId = (typeof SAMPLE_META)[number]["id"];
