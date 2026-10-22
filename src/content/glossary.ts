export type GlossaryEntry = {
  id: string;
  term: string;
  short: string;
  long: string;
};

export const glossary: GlossaryEntry[] = [
  {
    id: "eeg",
    term: "EEG",
    short: "Electroencephalography: voltage measured on the scalp.",
    long: "Electroencephalography records tiny voltage changes from electrodes on the scalp. The signal is a mixture of brain activity and noise. It is not a thought reader.",
  },
  {
    id: "ecg",
    term: "ECG",
    short: "Electrocardiography: the electrical signal of the heart.",
    long: "An ECG measures how the heart's electrical system spreads through heart muscle. Lead I, used here, is one view of that signal. It is not a full hospital ECG.",
  },
  {
    id: "electrode",
    term: "Electrode",
    short: "A metal contact that picks up voltage.",
    long: "An electrode does not send anything into the body in these labs. It only measures voltage. Names like O1 and C3 say where it sits on the head.",
  },
  {
    id: "frequency",
    term: "Frequency",
    short: "How many cycles happen each second, in hertz (Hz).",
    long: "A 10 Hz rhythm repeats 10 times a second. Frequency is not the same thing as strength. A rhythm can be fast and weak, or slow and strong.",
  },
  {
    id: "power",
    term: "Power",
    short: "How much of the signal sits in a frequency band.",
    long: "Absolute power is an amount, in microvolts squared for EEG. Relative power is that band's share of the five bands this lab measures. A bigger share can mean the band grew, or that the other bands shrank.",
  },
  {
    id: "sampling",
    term: "Sampling rate",
    short: "How many measurements are stored each second.",
    long: "The EEG files here are sampled at 160 Hz. The ECG files are sampled at 500 Hz. A Cyton board is usually 250 Hz. You cannot see frequencies above half the sampling rate.",
  },
  {
    id: "artifact",
    term: "Artifact",
    short: "A wiggle that did not come from the organ you meant to measure.",
    long: "Blinks, eye movement, jaw clenching, and electrical noise all show up in EEG. They can be larger than the brain signal. This lab does not automatically decide what is an artifact.",
  },
  {
    id: "alpha",
    term: "Alpha",
    short: "The 8–13 Hz band. Often larger at the back of the head with eyes closed.",
    long: "Posterior alpha often increases when a resting person closes their eyes. It does not do that in every recording, and it does not measure intelligence or emotion.",
  },
  {
    id: "rpeak",
    term: "R peak",
    short: "The tall spike in one heartbeat on an ECG.",
    long: "The R peak is part of the QRS complex, when the ventricles depolarize. The time from one R peak to the next is the R–R interval. Heart rate in beats per minute is 60 divided by that interval in seconds.",
  },
  {
    id: "qrs",
    term: "QRS complex",
    short: "The sharp part of the ECG, from the ventricles.",
    long: "Q is a small dip, R is the tall peak, and S is the dip after it. Together they mark the electrical signal that triggers the main squeeze of the heart.",
  },
  {
    id: "welch",
    term: "Welch's method",
    short: "A way to estimate a spectrum by averaging short windows.",
    long: "The recording is cut into overlapping 4-second pieces. Each piece is windowed with a Hann curve, its spectrum is taken, and those spectra are averaged. One window is a rough estimate. Averaging steadies it.",
  },
  {
    id: "microvolt",
    term: "Microvolt",
    short: "One millionth of a volt. EEG is usually measured in microvolts.",
    long: "Scalp EEG is often tens of microvolts. ECG is larger, so this lab plots the heart signal in millivolts.",
  },
];

export function glossaryEntry(id: string): GlossaryEntry | undefined {
  return glossary.find((entry) => entry.id === id);
}
