import type { BandName } from "../signal/bands";

export type EegRecord = {
  id: string;
  origin: "physionet";
  dataset: "eegmmidb";
  datasetName: string;
  version: string;
  url: string;
  citation: string;
  subject: string;
  run: string;
  condition: string;
  task: "baseline" | "motor";
  sfreq: number;
  unit: "uV";
  fileHighpassHz: number | null;
  fileLowpassHz: number | null;
  filterHighHz: number;
  filter: string;
  channels: string[];
  samples: Record<string, number[]>;
  durationS: number;
  bands: Record<string, { absoluteUv2: Record<BandName, number>; relative: Record<BandName, number> }>;
  timeline: {
    windowS: number;
    stepS: number;
    times: number[];
    absoluteUv2: Record<string, Record<BandName, number[]>>;
  };
  annotations: { onset: number; duration: number; label: string; meaning: string }[];
  sha256: string;
  sourceFile: string;
};

export type EcgRecord = {
  id: string;
  origin: "physionet";
  dataset: "ecgiddb";
  datasetName: string;
  version: string;
  url: string;
  citation: string;
  person: string;
  record: string;
  sfreq: number;
  unit: string;
  lead: string;
  leadNote: string;
  samples: number[];
  durationS: number;
  annotatedRPeaks: number[];
  annotatedTPeaks: number[];
  rSymbol: string | null;
  tSymbol: string | null;
  detectedRPeaks: number[];
  detectorMatches: number;
  peaksUsed: "annotated" | "detected";
  medianRrS: number | null;
  medianBpm: number | null;
  intervalCv: number | null;
  exampleBeat: {
    rIndex: number;
    qIndex: number;
    sIndex: number;
    tIndex: number | null;
    viewStart: number;
    viewEnd: number;
    markMethod: string;
  } | null;
  sha256: string;
  sourceFile: string;
  suggested: boolean;
};

export type Catalog = {
  eeg: { id: string; subject: string; run: string; condition: string; task: string }[];
  ecg: { id: string; person: string; record: string; suggested: boolean; medianBpm: number | null }[];
  filter: string;
};
