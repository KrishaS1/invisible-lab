export type ActionStatus = "ready" | "soon";

export type ActionApp = {
  id: string;
  name: string;
  status: ActionStatus;
  summary: string;
  href: string;
  later: string;
};

export const actionApps: ActionApp[] = [
  {
    id: "blink",
    name: "Blink-to-Select",
    status: "ready",
    summary: "Four choices scan in order. Manual control always works. A recording can drive a choice only after you load a file.",
    href: "/action",
    later: "",
  },
  {
    id: "heartbeat-art",
    name: "HeartBeat Art",
    status: "soon",
    summary: "Turn ECG timing into a picture.",
    href: "",
    later: "Not built. A later version could move a drawing on each annotated R peak. There is no art canvas in this version.",
  },
  {
    id: "brain-music",
    name: "Brain-to-Music",
    status: "soon",
    summary: "Map measured EEG features to more than one tone.",
    href: "",
    later: "Not built. Brain lab already plays one tone from alpha power. This would be a separate instrument, and it is not here.",
  },
  {
    id: "muscle",
    name: "Muscle-Controlled Interface",
    status: "soon",
    summary: "Use an EMG recording for a simple control.",
    href: "",
    later: "Not built. No muscle recording is bundled, and this page does not invent one.",
  },
  {
    id: "seismic",
    name: "Seismic Motion",
    status: "soon",
    summary: "Move an object from an earthquake trace.",
    href: "",
    later: "Not built. No seismic file is loaded.",
  },
  {
    id: "gene",
    name: "Gene Mutation Explorer",
    status: "soon",
    summary: "Read a DNA change and its predicted effect on a protein.",
    href: "",
    later: "Not built. Gene work is sequence-based. It would not reuse the EEG waveform or the blink detector.",
  },
];
