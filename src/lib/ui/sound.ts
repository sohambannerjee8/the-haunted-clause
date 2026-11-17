// Synthesised sound, off by default (haunted-house-ui R11). No audio files: one oscillator note
// per opened detail panel, its pitch dropping with severity, so the sound carries information.
import type { Severity } from "../analyzer/types";

export const PITCH_HZ = [660, 520, 390, 260] as const;
export const TONE_SECONDS = 0.45;
const PEAK_GAIN = 0.08;

export interface Sound {
  readonly enabled: boolean;
  /** Call from a user gesture: creates the AudioContext (R11.1). */
  enable(): void;
  disable(): void;
  play(severity: Severity): void;
}

export function createSound(Ctx: typeof AudioContext | undefined = globalThis.AudioContext): Sound {
  let ctx: AudioContext | null = null;
  let enabled = false;
  return {
    get enabled() {
      return enabled;
    },
    enable() {
      enabled = true;
      if (!ctx && Ctx) ctx = new Ctx();
      void ctx?.resume?.();
    },
    disable() {
      enabled = false;
      void ctx?.close?.();
      ctx = null;
    },
    play(severity) {
      if (!enabled || !ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = PITCH_HZ[severity];
      gain.gain.setValueAtTime(PEAK_GAIN, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + TONE_SECONDS);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + TONE_SECONDS);
    },
  };
}
