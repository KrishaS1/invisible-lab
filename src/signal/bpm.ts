export function bpmFromRrSeconds(rrSeconds: number): number {
  if (!(rrSeconds > 0)) {
    throw new Error("The R–R interval has to be longer than zero.");
  }
  return 60 / rrSeconds;
}

export type Direction = "up" | "down" | "same";

/** "same" means the second value stays within 10% of the first. */
export function direction(first: number, second: number): Direction {
  if (!(first > 0)) return second > 0 ? "up" : "same";
  const ratio = second / first;
  if (ratio > 1.1) return "up";
  if (ratio < 0.9) return "down";
  return "same";
}

export function percentChange(first: number, second: number): number | null {
  if (!(first > 0)) return null;
  return ((second - first) / first) * 100;
}
