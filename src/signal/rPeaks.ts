import { bandpass } from "./filter";

/**
 * A short Pan–Tompkins-style detector.
 * The Python copy in preprocessing/signal_math.py uses the same steps.
 * Lessons prefer the recording's own beat annotations when the file has them.
 */
export function detectRPeaks(samples: ArrayLike<number>, sfreq: number): number[] {
  if (samples.length < sfreq) return [];
  const high = Math.min(18, sfreq * 0.45);
  const filtered = bandpass(samples, sfreq, 5, high);
  const derivative = new Array<number>(filtered.length);
  derivative[0] = 0;
  for (let i = 1; i < filtered.length; i++) derivative[i] = filtered[i] - filtered[i - 1];
  const squared = derivative.map((value) => value * value);
  const win = Math.max(1, Math.round(0.15 * sfreq));
  const integrated = new Array<number>(squared.length).fill(0);
  let rolling = 0;
  for (let i = 0; i < squared.length; i++) {
    rolling += squared[i];
    if (i >= win) rolling -= squared[i - win];
    integrated[i] = rolling / win;
  }
  const sorted = [...integrated].sort((a, b) => a - b);
  const threshold = 0.35 * sorted[Math.floor(sorted.length * 0.98)];
  const refractory = Math.round(0.28 * sfreq);
  const peaks: number[] = [];
  let i = 1;
  while (i < integrated.length - 1) {
    const isPeak =
      integrated[i] >= threshold && integrated[i] >= integrated[i - 1] && integrated[i] >= integrated[i + 1];
    if (isPeak) {
      const lo = Math.max(0, i - Math.round(0.08 * sfreq));
      const hi = Math.min(filtered.length, i + Math.round(0.04 * sfreq));
      let rIndex = lo;
      let tallest = -Infinity;
      for (let j = lo; j < hi; j++) {
        if (filtered[j] > tallest) {
          tallest = filtered[j];
          rIndex = j;
        }
      }
      if (peaks.length === 0 || rIndex - peaks[peaks.length - 1] >= refractory) peaks.push(rIndex);
      i += refractory;
    } else {
      i += 1;
    }
  }
  return peaks;
}
