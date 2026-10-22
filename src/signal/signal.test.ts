import { describe, expect, it } from "vitest";
import { bpmFromRrSeconds, direction } from "./bpm";
import { detectRPeaks } from "./rPeaks";
import { welchBands } from "./welch";

function sine(freqHz: number, sfreq: number, seconds: number, amplitude = 1): number[] {
  const n = Math.round(seconds * sfreq);
  const samples = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * freqHz * i) / sfreq);
  }
  return samples;
}

describe("Welch band power", () => {
  it("puts a 10 Hz sine in alpha, near amplitude²/2", () => {
    const powers = welchBands(sine(10, 160, 20), 160);
    expect(powers.alpha.absoluteUv2).toBeGreaterThan(0.42);
    expect(powers.alpha.absoluteUv2).toBeLessThan(0.58);
    expect(powers.alpha.relative).toBeGreaterThan(0.9);
  });

  it("ignores a huge offset on that same sine", () => {
    const wave = sine(10, 160, 20).map((sample) => sample + 10000);
    const powers = welchBands(wave, 160);
    expect(powers.alpha.absoluteUv2).toBeGreaterThan(0.42);
    expect(powers.alpha.absoluteUv2).toBeLessThan(0.58);
  });

  it("puts a 2 Hz sine in delta and a 20 Hz sine in beta", () => {
    expect(welchBands(sine(2, 160, 30), 160).delta.relative).toBeGreaterThan(0.75);
    expect(welchBands(sine(20, 160, 20), 160).beta.relative).toBeGreaterThan(0.75);
  });
});

describe("heart rate", () => {
  it("uses BPM = 60 / R–R", () => {
    expect(bpmFromRrSeconds(1)).toBe(60);
    expect(bpmFromRrSeconds(0.8)).toBeCloseTo(75, 5);
  });

  it("rejects a zero interval", () => {
    expect(() => bpmFromRrSeconds(0)).toThrow();
  });

  it("calls a 10% change about the same", () => {
    expect(direction(10, 10.5)).toBe("same");
    expect(direction(10, 12)).toBe("up");
    expect(direction(10, 8)).toBe("down");
  });
});

describe("R peaks", () => {
  it("finds a 60 bpm spike train", () => {
    const sfreq = 500;
    const samples = new Array<number>(20 * sfreq).fill(0);
    const period = sfreq;
    const width = Math.round(0.012 * sfreq);
    for (let center = period; center < samples.length - period; center += period) {
      for (let i = -width; i <= width; i++) {
        const hann = 0.5 - 0.5 * Math.cos((Math.PI * (i + width)) / width);
        samples[center + i] += hann;
      }
    }
    const peaks = detectRPeaks(samples, sfreq);
    expect(peaks.length).toBeGreaterThanOrEqual(15);
    expect(peaks.length).toBeLessThanOrEqual(20);
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) intervals.push((peaks[i] - peaks[i - 1]) / sfreq);
    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    expect(60 / median).toBeGreaterThan(58);
    expect(60 / median).toBeLessThan(62);
  });
});
