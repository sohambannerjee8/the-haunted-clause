// The provider interface and the 15-second timeout (llm-explainer R5). Reads no environment.
import type { ExplainClause } from "./schema";

export const LLM_TIMEOUT_MS = 15_000;

/** Returns the model's raw text for the given clauses. */
export interface Provider {
  explain(clauses: readonly ExplainClause[], opts: { signal: AbortSignal }): Promise<string>;
}

export interface TimedProvider {
  explain(clauses: readonly ExplainClause[]): Promise<string>;
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`timed out after ${ms} ms`);
    this.name = "TimeoutError";
  }
}

export function isTimeoutError(e: unknown): e is TimeoutError {
  return e instanceof TimeoutError;
}

/**
 * Run `task` with an AbortSignal and reject with TimeoutError after `ms`, aborting the signal.
 * The race settles on time even if the task ignores the signal (R5.2). The timer is always cleared.
 */
export function runWithTimeout<T>(task: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(ms));
    }, ms);
  });
  const run = new Promise<T>((resolve, reject) => {
    try {
      task(controller.signal).then(resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
  return Promise.race([run, timeout]).finally(() => clearTimeout(timer));
}

export function withTimeout(provider: Provider, ms: number): TimedProvider {
  return { explain: (clauses) => runWithTimeout((signal) => provider.explain(clauses, { signal }), ms) };
}
