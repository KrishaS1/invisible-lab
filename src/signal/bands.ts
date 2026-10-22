// Band edges are shared with preprocessing/signal_math.py.
// The upper edge is exclusive, except gamma, which includes 45 Hz.

export const BANDS = [
  {
    id: "delta",
    label: "Delta",
    low: 0.5,
    high: 4,
    includeHigh: false,
    blurb: "The slowest band in this lab. It is most obvious in deep sleep.",
  },
  {
    id: "theta",
    label: "Theta",
    low: 4,
    high: 8,
    includeHigh: false,
    blurb: "A slow waking rhythm. Drowsiness can raise it. It is not a mood meter.",
  },
  {
    id: "alpha",
    label: "Alpha",
    low: 8,
    high: 13,
    includeHigh: false,
    blurb: "Often strong at the back of the head when someone is awake with eyes closed.",
  },
  {
    id: "beta",
    label: "Beta",
    low: 13,
    high: 30,
    includeHigh: false,
    blurb: "A faster rhythm. Jaw and forehead muscles can leak into this band.",
  },
  {
    id: "gamma",
    label: "Gamma",
    low: 30,
    high: 45,
    includeHigh: true,
    blurb: "The fastest band we measure. The skull weakens it, so scalp gamma is easy to confuse with muscle activity.",
  },
] as const;

export type BandName = (typeof BANDS)[number]["id"];

export const FILTER_LOW_HZ = 0.5;
export const FILTER_HIGH_HZ = 55;

export function filterHighHz(sfreq: number): number {
  return Math.min(FILTER_HIGH_HZ, sfreq * 0.45);
}

export const PREP_NOTE =
  "Band-pass 0.5–55 Hz, 4th-order Butterworth, zero phase (lower if the sampling rate cannot support 55 Hz). Welch method, Hann window, 4 s segments, 50% overlap. The summary skips the first and last 2 seconds.";
