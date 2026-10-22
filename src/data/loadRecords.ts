import type { Catalog, EcgRecord, EegRecord } from "./types";

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}. If you just cloned the project, run the prepare step in the install guide.`);
  }
  return response.json() as Promise<T>;
}

export function loadCatalog(): Promise<Catalog> {
  return loadJson("/data/catalog.json");
}

export function loadEeg(id: string): Promise<EegRecord> {
  return loadJson(`/data/eeg/${id}.json`);
}

export function loadEcg(id: string): Promise<EcgRecord> {
  return loadJson(`/data/ecg/${id}.json`);
}

export function posteriorAlpha(record: EegRecord): number | null {
  const channels = ["O1", "O2"].filter((name) => record.bands[name]);
  if (channels.length === 0) return null;
  const total = channels.reduce((sum, name) => sum + record.bands[name].absoluteUv2.alpha, 0);
  return total / channels.length;
}

export function peakIndices(record: EcgRecord): number[] {
  return record.peaksUsed === "annotated" ? record.annotatedRPeaks : record.detectedRPeaks;
}
