export const SCAN_OPTIONS = ["Water", "Help", "Yes", "No"] as const;

export type ScanSource = "manual" | "recorded" | "live";

export type Selection = {
  option: string;
  elapsedMs: number;
  source: ScanSource;
};

export function highlightIndex(elapsedMs: number, optionCount: number, dwellMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new Error("Elapsed time must be zero or positive.");
  }
  if (!Number.isInteger(optionCount) || optionCount < 1) {
    throw new Error("Need at least one option.");
  }
  if (!Number.isFinite(dwellMs) || dwellMs <= 0) {
    throw new Error("Dwell time must be greater than zero.");
  }
  return Math.floor(elapsedMs / dwellMs) % optionCount;
}

export function optionAt(elapsedMs: number, dwellMs: number, options: readonly string[] = SCAN_OPTIONS): string {
  return options[highlightIndex(elapsedMs, options.length, dwellMs)];
}

export function activateSelection(elapsedMs: number, dwellMs: number, source: ScanSource): Selection {
  return {
    option: optionAt(elapsedMs, dwellMs),
    elapsedMs,
    source,
  };
}
