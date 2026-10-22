export type LabStatus = "ready" | "soon";

export type LabEntry = {
  id: string;
  name: string;
  accent: string;
  status: LabStatus;
  category: string;
  summary: string;
  href: string;
  experiments: { id: string; title: string; href: string }[];
  later: string;
};

export const labs: LabEntry[] = [
  {
    id: "brain",
    name: "Brain lab",
    accent: "eeg",
    status: "ready",
    category: "EEG",
    summary: "Electrical activity at the scalp. Eyes open and closed, frequency bands, movement, artifacts, and an optional tone.",
    href: "/brain/eyes",
    experiments: [
      { id: "eyes", title: "Eyes open and closed", href: "/brain/eyes" },
      { id: "bands", title: "Frequency bands", href: "/brain/bands" },
      { id: "movement", title: "Movement", href: "/brain/movement" },
      { id: "artifacts", title: "Artifacts", href: "/brain/artifacts" },
      { id: "listen", title: "Listen", href: "/brain/listen" },
    ],
    later: "",
  },
  {
    id: "heart",
    name: "Heart lab",
    accent: "ecg",
    status: "ready",
    category: "ECG",
    summary: "The electrical signal of a heartbeat. Find R peaks, compute a heart rate, and hear the timing.",
    href: "/heart/rate",
    experiments: [
      { id: "rate", title: "Heart rate", href: "/heart/rate" },
      { id: "beat", title: "Parts of a beat", href: "/heart/beat" },
      { id: "listen", title: "Listen", href: "/heart/listen" },
    ],
    later: "",
  },
  {
    id: "earth",
    name: "Earth lab",
    accent: "earth",
    status: "ready",
    category: "Seismology",
    summary: "Real STEAD recordings with manual P/S picks, channel exploration, and arrival-interval measurement.",
    href: "/earth/arrivals",
    experiments: [{ id: "earth-arrivals", title: "P and S arrivals", href: "/earth/arrivals" }],
    later: "",
  },
  {
    id: "physics",
    name: "Physics lab",
    accent: "physics",
    status: "ready",
    category: "Waves",
    summary: "A mathematical sound-wave simulation: frequency, amplitude, phase, and interference.",
    href: "/physics/interference",
    experiments: [{ id: "physics-interference", title: "Sound interference", href: "/physics/interference" }],
    later: "",
  },
  {
    id: "gene",
    name: "Gene lab",
    accent: "gene",
    status: "soon",
    category: "DNA",
    summary: "Sequences, codons, and a conceptual look at editing.",
    href: "/soon/gene",
    experiments: [],
    later: "Gene lab would be a sequence view, not a waveform. It is not built, and this app does not invent DNA traces.",
  },
  {
    id: "space",
    name: "Space lab",
    accent: "space",
    status: "soon",
    category: "Astronomy",
    summary: "Measurements from telescopes and spacecraft.",
    href: "/soon/space",
    experiments: [],
    later: "A later version could chart a published light curve or radio time series. Nothing astronomical is bundled.",
  },
  {
    id: "muscle",
    name: "Muscle lab",
    accent: "muscle",
    status: "soon",
    category: "EMG",
    summary: "Electrical activity from a contracting muscle.",
    href: "/soon/muscle",
    experiments: [],
    later: "EMG could reuse the time-series chart. There is no muscle recording in this version.",
  },
];

export function labById(id: string): LabEntry | undefined {
  return labs.find((lab) => lab.id === id);
}
