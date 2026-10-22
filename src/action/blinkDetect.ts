// A candidate mark is a large, brief bump on one channel.
// It is not proof of an eye blink. Blinks are usually strongest at frontal
// electrodes such as Fp1 and Fp2. The Cyton layout used in this project
// (C3, Cz, C4, P3, Pz, P4, O1, O2) often misses them.

export type BlinkSettings = {
  thresholdUv: number;
  minDurationMs: number;
  maxDurationMs: number;
  refractoryMs: number;
};

export type CandidateEvent = {
  startIndex: number;
  endIndex: number;
  peakIndex: number;
  peakUv: number;
  timeS: number;
};

export const DEFAULT_BLINK_SETTINGS: BlinkSettings = {
  thresholdUv: 100,
  minDurationMs: 80,
  maxDurationMs: 400,
  refractoryMs: 600,
};

const WEAK_FOR_BLINKS = new Set(["C3", "Cz", "C4", "P3", "Pz", "P4", "O1", "O2"]);

export function blinkChannelNote(channel: string): string | null {
  if (WEAK_FOR_BLINKS.has(channel)) {
    return `${channel} is not a frontal electrode. A bump here is only a candidate. Blinks are usually larger at Fp1 or Fp2, and this headset layout may miss them.`;
  }
  return null;
}

export function detectCandidateEvents(
  samples: ArrayLike<number>,
  sfreq: number,
  settings: BlinkSettings,
): CandidateEvent[] {
  if (!Number.isFinite(sfreq) || sfreq < 100 || sfreq > 2000) {
    throw new Error("Sampling rate must be between 100 and 2000 Hz.");
  }
  if (!Number.isFinite(settings.thresholdUv) || settings.thresholdUv <= 0) {
    throw new Error("Threshold must be a positive number of microvolts.");
  }
  if (!Number.isFinite(settings.minDurationMs) || settings.minDurationMs < 1) {
    throw new Error("Minimum duration must be at least 1 ms.");
  }
  if (!Number.isFinite(settings.maxDurationMs) || settings.maxDurationMs < settings.minDurationMs) {
    throw new Error("Maximum duration must be at least the minimum duration.");
  }
  if (!Number.isFinite(settings.refractoryMs) || settings.refractoryMs < 0) {
    throw new Error("Refractory period cannot be negative.");
  }
  const count = samples.length;
  if (count < Math.floor(sfreq * 0.2)) {
    throw new Error("The recording is too short to look for a candidate event.");
  }

  const centered: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const value = samples[i];
    if (!Number.isFinite(value)) throw new Error("The recording contains a non-numeric sample.");
    centered[i] = value;
  }
  const baseline = median(centered);
  for (let i = 0; i < count; i++) centered[i] -= baseline;

  // 40 ms average. A one-sample spike shrinks. A blink-sized bump stays wide.
  const smooth = movingAverage(centered, Math.max(1, Math.round(0.04 * sfreq)));
  const minSamples = Math.max(1, Math.round((settings.minDurationMs / 1000) * sfreq));
  const maxSamples = Math.round((settings.maxDurationMs / 1000) * sfreq);
  const refractorySamples = Math.round((settings.refractoryMs / 1000) * sfreq);

  const events: CandidateEvent[] = [];
  let index = 0;
  while (index < count) {
    if (Math.abs(smooth[index]) < settings.thresholdUv) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < count && Math.abs(smooth[index]) >= settings.thresholdUv) index += 1;
    const end = index - 1;
    const width = end - start + 1;
    if (width < minSamples || width > maxSamples) continue;

    let peakIndex = start;
    for (let cursor = start + 1; cursor <= end; cursor++) {
      if (Math.abs(smooth[cursor]) > Math.abs(smooth[peakIndex])) peakIndex = cursor;
    }
    const previous = events[events.length - 1];
    if (previous && peakIndex - previous.peakIndex < refractorySamples) continue;

    events.push({
      startIndex: start,
      endIndex: end,
      peakIndex,
      peakUv: round3(smooth[peakIndex]),
      timeS: peakIndex / sfreq,
    });
  }
  return events;
}

function median(values: number[]): number {
  const copy = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(copy.length / 2);
  if (copy.length % 2 === 1) return copy[mid];
  return (copy[mid - 1] + copy[mid]) / 2;
}

function movingAverage(values: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  const prefix = new Array<number>(values.length + 1);
  prefix[0] = 0;
  for (let i = 0; i < values.length; i++) prefix[i + 1] = prefix[i] + values[i];
  const out = new Array<number>(values.length);
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length - 1, i + half);
    out[i] = (prefix[end + 1] - prefix[start]) / (end - start + 1);
  }
  return out;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
