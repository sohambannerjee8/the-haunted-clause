"use client";
// The app's client root (haunted-house-ui design, "State"). Holds all state in memory only
// (R1.6, R3.4) and receives only a boolean from the server (R14.1).
import { MotionConfig } from "motion/react";
import { useRef, useState } from "react";
import type { SampleId } from "../lib/samples/meta";
import { createRetryableImport } from "../lib/ui/retryableImport";
import { ErrorBoundary } from "./ErrorBoundary";
import type { Prepared, Source } from "./house/HouseView";
import { InputScreen, type InputNotice } from "./InputScreen";
import { SampleCards } from "./SampleCards";

// The house view, the analyzer and the sample texts load on first use (R17.1).
const loadHouse = createRetryableImport(() => import("./house/HouseView"));
type HouseModule = Awaited<ReturnType<typeof loadHouse>>;

type State =
  | { screen: "input"; text: string; notice?: InputNotice }
  | { screen: "loading"; text: string; source: Source }
  | { screen: "house"; text: string; prepared: Prepared; mod: HouseModule }
  | { screen: "load-error"; text: string; source: Source };

export const LOAD_ERROR = "The house would not open. Check your connection and try again.";

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-10 text-center">
      <p role="alert" className="text-lg text-bone">
        {LOAD_ERROR}
      </p>
      <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-md bg-candle px-6 py-2 font-bold text-ink">
        Try again
      </button>
    </div>
  );
}

export function HauntedApp({ llmAvailable }: { llmAvailable: boolean }) {
  const [state, setState] = useState<State>({ screen: "input", text: "" });
  const run = useRef(0);

  async function open(source: Source, text: string) {
    const id = ++run.current;
    setState({ screen: "loading", text, source });
    try {
      const mod = await loadHouse();
      const r = await mod.prepare(source, text);
      if (id !== run.current) return;
      if (!r.ok) setState({ screen: "input", text, notice: "too-long" });
      else setState({ screen: "house", text, prepared: r.prepared, mod });
    } catch {
      if (id === run.current) setState({ screen: "load-error", text, source });
    }
  }

  function analyzePasted() {
    if (state.screen !== "input") return;
    if (state.text.trim() === "") setState({ ...state, notice: "empty" });
    else void open({ kind: "pasted" }, state.text);
  }

  function back(prepared: Prepared) {
    run.current++;
    // Pasted text stays in the box; after a sample the box is empty (R17.4).
    setState({ screen: "input", text: prepared.source.kind === "pasted" ? prepared.input : "" });
  }

  let body;
  switch (state.screen) {
    case "input":
      body = (
        <>
          <InputScreen
            text={state.text}
            notice={state.notice}
            onChange={(text, notice) => setState({ screen: "input", text, notice })}
            onAnalyze={analyzePasted}
          />
          <SampleCards onOpen={(id: SampleId) => void open({ kind: "sample", id }, "")} />
        </>
      );
      break;
    case "loading":
      body = <p className="py-10 text-center text-lg text-mist">Opening the house…</p>;
      break;
    case "load-error": {
      const { source, text } = state;
      body = <LoadError onRetry={() => void open(source, text)} />;
      break;
    }
    case "house": {
      const { mod, prepared } = state;
      body = (
        <ErrorBoundary fallback={<LoadError onRetry={() => void open(prepared.source, state.text)} />}>
          <mod.HouseView prepared={prepared} llmAvailable={llmAvailable} onBack={() => back(prepared)} />
        </ErrorBoundary>
      );
      break;
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="content"
        tabIndex={-1}
        aria-busy={state.screen === "loading" ? true : undefined}
        data-llm-available={llmAvailable ? "true" : "false"}
        className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12"
      >
        {body}
      </main>
    </MotionConfig>
  );
}
