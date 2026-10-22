import { VERIFIED_BLINK_RECORDING } from "./modes";

export type DemoStep = {
  id: "problem" | "brain" | "alpha" | "heart" | "rate" | "action" | "openbci" | "future";
  part: string;
  title: string;
  // What actually drives the step. Live hardware is never started from the tour.
  drive: "text" | "physionet-eeg" | "physionet-ecg" | "manual-scan" | "recorded-events";
};

export function demoSteps(verifiedBlink: boolean = VERIFIED_BLINK_RECORDING !== null): DemoStep[] {
  return [
    { id: "problem", part: "1", title: "A lab for everyone", drive: "text" },
    { id: "brain", part: "2", title: "A real EEG recording", drive: "physionet-eeg" },
    { id: "alpha", part: "2", title: "Eyes open and eyes closed", drive: "physionet-eeg" },
    { id: "heart", part: "3", title: "A real ECG recording", drive: "physionet-ecg" },
    { id: "rate", part: "3", title: "Heart rate from the peaks", drive: "physionet-ecg" },
    {
      id: "action",
      part: "4",
      title: "Blink-to-Select",
      drive: verifiedBlink ? "recorded-events" : "manual-scan",
    },
    { id: "openbci", part: "5", title: "A headset you record yourself", drive: "text" },
    { id: "future", part: "6", title: "Keep exploring", drive: "text" },
  ];
}
