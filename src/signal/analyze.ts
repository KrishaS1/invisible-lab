import { filterHighHz, FILTER_LOW_HZ, type BandName } from "./bands";
import { bandpass } from "./filter";
import { bandTimeline, summaryBands, type Timeline } from "./welch";

export type ChannelAnalysis = {
  filtered: Record<string, number[]>;
  bands: Record<string, { absoluteUv2: Record<BandName, number>; relative: Record<BandName, number> }>;
  timeline: Record<string, Timeline>;
  warnings: string[];
};

export function analyzeChannels(samples: Record<string, number[]>, sfreq: number): ChannelAnalysis {
  const warnings: string[] = [];
  const high = filterHighHz(sfreq);
  if (high < 45) {
    warnings.push(`At ${sfreq} Hz sampling, the low-pass sits at ${high.toFixed(0)} Hz, so the gamma band is only partly measured.`);
  }
  const duration = samples[Object.keys(samples)[0]]?.length ?? 0;
  if (duration < sfreq * 8) {
    warnings.push("This clip is under 8 seconds. Band power from it will be shaky.");
  }
  const filtered: Record<string, number[]> = {};
  const bands: ChannelAnalysis["bands"] = {};
  const timeline: Record<string, Timeline> = {};
  for (const [name, data] of Object.entries(samples)) {
    const y = bandpass(data, sfreq, FILTER_LOW_HZ, high);
    filtered[name] = y;
    const summary = summaryBands(y, sfreq, 2);
    const absoluteUv2 = {} as Record<BandName, number>;
    const relative = {} as Record<BandName, number>;
    (Object.keys(summary) as BandName[]).forEach((band) => {
      absoluteUv2[band] = summary[band].absoluteUv2;
      relative[band] = summary[band].relative;
    });
    bands[name] = { absoluteUv2, relative };
    timeline[name] = bandTimeline(y, sfreq, 2);
  }
  return { filtered, bands, timeline, warnings };
}

export function alphaBetween(samples: number[], sfreq: number, startS: number, endS: number): number | null {
  const lo = Math.max(0, Math.round(startS * sfreq));
  const hi = Math.min(samples.length, Math.round(endS * sfreq));
  if (hi - lo < sfreq * 4) return null;
  return summaryBands(samples.slice(lo, hi), sfreq, 0).alpha.absoluteUv2;
}
