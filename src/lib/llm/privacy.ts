// The one source of the opt-in privacy wording (llm-explainer R17, PLAN_DECISIONS.md C10.12).
// README.md repeats OPT_IN_NOTICE word for word; scripts/docs.test.mts keeps them in step.
export const GEMINI_TERMS_URL = "https://ai.google.dev/gemini-api/terms";

export const OPT_IN_NOTICE =
  "This app does not store your text. If you continue, only the flagged clauses " +
  "are sent to Google Gemini for a plain-English reading. Google processes them " +
  "under its own terms.";
