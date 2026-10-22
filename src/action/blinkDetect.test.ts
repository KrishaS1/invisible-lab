import { describe, expect, it } from "vitest";
import { DEFAULT_BLINK_SETTINGS, detectCandidateEvents } from "./blinkDetect";

const SFREQ = 250;

function baseline(seconds: number): number[] {
  const count = Math.round(seconds * SFREQ);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(Math.sin((2 * Math.PI * 10 * i) / SFREQ) * 8);
  }
  return out;
}

function addPulse(signal: number[], timeS: number, widthMs: number, amplitude: number) {
  const start = Math.round(timeS * SFREQ);
  const width = Math.round((widthMs / 1000) * SFREQ);
  for (let i = 0; i < width; i++) signal[start + i] += amplitude;
}

describe("candidate event detector", () => {
  it("marks a blink-sized pulse and ignores the 10 Hz background", () => {
    const signal = baseline(4);
    addPulse(signal, 1.2, 160, 220);
    const events = detectCandidateEvents(signal, SFREQ, DEFAULT_BLINK_SETTINGS);
    expect(events).toHaveLength(1);
    expect(events[0].timeS).toBeGreaterThan(1.15);
    expect(events[0].timeS).toBeLessThan(1.45);
  });

  it("keeps the second pulse only after the refractory period", () => {
    const signal = baseline(4);
    addPulse(signal, 1.0, 160, 220);
    addPulse(signal, 1.35, 160, 220);
    addPulse(signal, 2.4, 160, 220);
    const events = detectCandidateEvents(signal, SFREQ, DEFAULT_BLINK_SETTINGS);
    expect(events).toHaveLength(2);
    expect(events[0].timeS).toBeGreaterThan(0.95);
    expect(events[0].timeS).toBeLessThan(1.25);
    expect(events[1].timeS).toBeGreaterThan(2.35);
    expect(events[1].timeS).toBeLessThan(2.65);
  });

  it("rejects a spike that is too short and a drift that is too long", () => {
    const spike = baseline(3);
    addPulse(spike, 1, 16, 400);
    expect(detectCandidateEvents(spike, SFREQ, DEFAULT_BLINK_SETTINGS)).toEqual([]);

    const drift = baseline(3);
    addPulse(drift, 0.4, 900, 220);
    expect(detectCandidateEvents(drift, SFREQ, DEFAULT_BLINK_SETTINGS)).toEqual([]);
  });

  it("returns no events for ordinary noise under the threshold", () => {
    const noise = baseline(3).map((value, index) => value + (index % 2 === 0 ? 15 : -15));
    expect(detectCandidateEvents(noise, SFREQ, DEFAULT_BLINK_SETTINGS)).toEqual([]);
  });

  it("rejects a recording that is not usable", () => {
    expect(() => detectCandidateEvents([1, 2, 3], SFREQ, DEFAULT_BLINK_SETTINGS)).toThrow(/too short/);
    expect(() => detectCandidateEvents(baseline(1), 0, DEFAULT_BLINK_SETTINGS)).toThrow(/Sampling rate/);
    const broken = baseline(1);
    broken[10] = Number.NaN;
    expect(() => detectCandidateEvents(broken, SFREQ, DEFAULT_BLINK_SETTINGS)).toThrow(/non-numeric/);
  });
});
