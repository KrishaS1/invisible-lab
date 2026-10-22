import { BANDS, type BandName } from "./bands";
import { fft, nextPow2 } from "./fft";

export type BandPower = {
  absoluteUv2: number;
  relative: number;
};

export type BandMap = Record<BandName, BandPower>;

function hann(length: number): Float64Array {
  const window = new Float64Array(length);
  if (length === 1) {
    window[0] = 1;
    return window;
  }
  for (let i = 0; i < length; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1));
  }
  return window;
}

function trap(freqs: number[], psd: number[], lo: number, hi: number, includeHigh: boolean): number {
  const pickedF: number[] = [];
  const pickedP: number[] = [];
  for (let i = 0; i < freqs.length; i++) {
    const freq = freqs[i];
    const inside = includeHigh ? freq >= lo && freq <= hi : freq >= lo && freq < hi;
    if (inside) {
      pickedF.push(freq);
      pickedP.push(psd[i]);
    }
  }
  if (pickedF.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < pickedF.length; i++) {
    total += ((pickedP[i] + pickedP[i - 1]) / 2) * (pickedF[i] - pickedF[i - 1]);
  }
  return total;
}

/** Power spectral density in unit²/Hz, Welch-averaged, one-sided. */
export function welchPsd(samples: ArrayLike<number>, sfreq: number, segmentS = 4): { freqs: number[]; psd: number[] } {
  const nperseg = Math.min(samples.length, Math.round(segmentS * sfreq));
  if (nperseg < 16) {
    throw new Error("This clip is too short for a spectrum.");
  }
  const nfft = nextPow2(nperseg);
  const noverlap = Math.floor(nperseg / 2);
  const step = nperseg - noverlap;
  const window = hann(nperseg);
  let windowPower = 0;
  for (let i = 0; i < nperseg; i++) windowPower += window[i] * window[i];
  // One-sided density. Bins other than DC and Nyquist are doubled.
  const scale = 1 / (sfreq * windowPower);
  const acc = new Float64Array(nfft / 2 + 1);
  let count = 0;
  for (let start = 0; start + nperseg <= samples.length; start += step) {
    let mean = 0;
    for (let i = 0; i < nperseg; i++) mean += samples[start + i];
    mean /= nperseg;
    const real = new Float64Array(nfft);
    const imag = new Float64Array(nfft);
    for (let i = 0; i < nperseg; i++) real[i] = (samples[start + i] - mean) * window[i];
    fft(real, imag);
    const nyquist = nfft / 2;
    acc[0] += (real[0] * real[0] + imag[0] * imag[0]) * scale;
    for (let k = 1; k < nyquist; k++) {
      acc[k] += (real[k] * real[k] + imag[k] * imag[k]) * scale * 2;
    }
    acc[nyquist] += (real[nyquist] * real[nyquist] + imag[nyquist] * imag[nyquist]) * scale;
    count += 1;
  }
  if (count === 0) throw new Error("This clip is too short for a spectrum.");
  const freqs: number[] = [];
  const psd: number[] = [];
  for (let k = 0; k < acc.length; k++) {
    freqs.push((k * sfreq) / nfft);
    psd.push(acc[k] / count);
  }
  return { freqs, psd };
}

export function welchBands(samples: ArrayLike<number>, sfreq: number, segmentS = 4): BandMap {
  const { freqs, psd } = welchPsd(samples, sfreq, segmentS);
  const absolute: Record<string, number> = {};
  let total = 0;
  for (const band of BANDS) {
    const power = trap(freqs, psd, band.low, band.high, band.includeHigh);
    absolute[band.id] = power;
    total += power;
  }
  const result = {} as BandMap;
  for (const band of BANDS) {
    result[band.id] = {
      absoluteUv2: absolute[band.id],
      relative: total > 0 ? absolute[band.id] / total : 0,
    };
  }
  return result;
}

export function summaryBands(samples: ArrayLike<number>, sfreq: number, trimS = 2): BandMap {
  const trim = Math.round(trimS * sfreq);
  const usable =
    samples.length > trim * 2 + sfreq
      ? Array.prototype.slice.call(samples, trim, samples.length - trim)
      : samples;
  return welchBands(usable, sfreq, 4);
}

export type Timeline = {
  windowS: number;
  stepS: number;
  times: number[];
  absoluteUv2: Record<BandName, number[]>;
};

export function bandTimeline(samples: ArrayLike<number>, sfreq: number, trimS = 2): Timeline {
  const window = Math.round(4 * sfreq);
  const step = Math.round(2 * sfreq);
  const trim = Math.round(trimS * sfreq);
  const times: number[] = [];
  const absoluteUv2 = {
    delta: [] as number[],
    theta: [] as number[],
    alpha: [] as number[],
    beta: [] as number[],
    gamma: [] as number[],
  };
  const last = samples.length - trim;
  for (let start = trim; start + window <= last; start += step) {
    const chunk = Array.prototype.slice.call(samples, start, start + window) as number[];
    const powers = welchBands(chunk, sfreq, 4);
    times.push((start + window / 2) / sfreq);
    for (const band of BANDS) absoluteUv2[band.id].push(powers[band.id].absoluteUv2);
  }
  return { windowS: 4, stepS: 2, times, absoluteUv2 };
}
