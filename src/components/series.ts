export type ChartPoint = { t: number; v: number };

/** Keep peaks visible when a strip has more samples than the chart can draw. */
export function displaySeries(samples: ArrayLike<number>, sfreq: number, start: number, count: number, maxPoints = 700): ChartPoint[] {
  const lo = Math.max(0, start);
  const hi = Math.min(samples.length, start + count);
  const n = hi - lo;
  if (n <= 0) return [];
  if (n <= maxPoints) {
    const points: ChartPoint[] = [];
    for (let i = lo; i < hi; i++) points.push({ t: i / sfreq, v: samples[i] });
    return points;
  }
  const points: ChartPoint[] = [];
  const bucket = n / maxPoints;
  for (let b = 0; b < maxPoints; b++) {
    const from = lo + Math.floor(b * bucket);
    const to = Math.min(hi, lo + Math.floor((b + 1) * bucket));
    let min = Infinity;
    let max = -Infinity;
    let minAt = from;
    let maxAt = from;
    for (let i = from; i < to; i++) {
      const value = samples[i];
      if (value < min) {
        min = value;
        minAt = i;
      }
      if (value > max) {
        max = value;
        maxAt = i;
      }
    }
    const earlier = minAt <= maxAt ? { t: minAt / sfreq, v: min } : { t: maxAt / sfreq, v: max };
    const later = minAt <= maxAt ? { t: maxAt / sfreq, v: max } : { t: minAt / sfreq, v: min };
    points.push(earlier, later);
  }
  return points;
}

export function sharedDomain(series: ArrayLike<number>[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const samples of series) {
    for (let i = 0; i < samples.length; i++) {
      const value = samples[i];
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  if (!Number.isFinite(min) || min === max) return [-1, 1];
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}
