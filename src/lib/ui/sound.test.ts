import { describe, expect, it, vi } from "vitest";
import { createSound, PITCH_HZ, TONE_SECONDS } from "./sound";

function fakeAudio() {
  const made: FakeCtx[] = [];
  class FakeCtx {
    currentTime = 10;
    destination = {};
    oscillators: { frequency: { value: number }; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn> }[] = [];
    gains: { gain: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn> }[] = [];
    resume = vi.fn(async () => {});
    close = vi.fn(async () => {});
    constructor() {
      made.push(this);
    }
    createOscillator() {
      const o = { type: "sine", frequency: { value: 0 }, start: vi.fn(), stop: vi.fn(), connect: vi.fn() };
      this.oscillators.push(o);
      return o;
    }
    createGain() {
      const g = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
      this.gains.push(g);
      return g;
    }
  }
  return { FakeCtx: FakeCtx as unknown as typeof AudioContext, made };
}

describe("sound (R11.1, R11.3, R11.4)", () => {
  it("creates no AudioContext until enable()", () => {
    const { FakeCtx, made } = fakeAudio();
    const sound = createSound(FakeCtx);
    expect(made).toHaveLength(0);
    sound.play(3); // off: nothing happens
    expect(made).toHaveLength(0);
    sound.enable();
    expect(made).toHaveLength(1);
    expect(sound.enabled).toBe(true);
  });
  it("plays one tone whose pitch drops with severity", () => {
    expect(PITCH_HZ).toEqual([660, 520, 390, 260]);
    const { FakeCtx, made } = fakeAudio();
    const sound = createSound(FakeCtx);
    sound.enable();
    for (const s of [0, 1, 2, 3] as const) sound.play(s);
    const ctx = made[0] as unknown as { oscillators: { frequency: { value: number } }[] };
    expect(ctx.oscillators.map((o) => o.frequency.value)).toEqual([660, 520, 390, 260]);
  });
  it("each tone lasts at most 600 ms, with a gain fade", () => {
    expect(TONE_SECONDS).toBeLessThanOrEqual(0.6);
    const { FakeCtx, made } = fakeAudio();
    const sound = createSound(FakeCtx);
    sound.enable();
    sound.play(2);
    const ctx = made[0] as unknown as {
      currentTime: number;
      oscillators: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[];
      gains: { gain: { exponentialRampToValueAtTime: ReturnType<typeof vi.fn> } }[];
    };
    const [o] = ctx.oscillators;
    const start = o.start.mock.calls[0][0] as number;
    const stop = o.stop.mock.calls[0][0] as number;
    expect(stop - start).toBeLessThanOrEqual(0.6);
    expect(stop - start).toBeGreaterThan(0);
    expect(ctx.gains[0].gain.exponentialRampToValueAtTime).toHaveBeenCalled();
  });
  it("disable() stops playing and closes the context", () => {
    const { FakeCtx, made } = fakeAudio();
    const sound = createSound(FakeCtx);
    sound.enable();
    sound.disable();
    expect(sound.enabled).toBe(false);
    expect((made[0] as unknown as { close: ReturnType<typeof vi.fn> }).close).toHaveBeenCalled();
    sound.play(1);
    expect((made[0] as unknown as { oscillators: unknown[] }).oscillators).toHaveLength(0);
  });
  it("does nothing when the browser has no Web Audio", () => {
    const sound = createSound(undefined);
    sound.enable();
    expect(() => sound.play(3)).not.toThrow();
  });
});
