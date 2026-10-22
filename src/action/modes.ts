import type { ScanSource } from "./scanner";

export type InputMode = ScanSource;

export type ModeSwitch = {
  mode: InputMode;
  notice: string | null;
  resetClock: boolean;
};

// No file in this project is a verified blink recording. Recorded mode
// stays unavailable until the student loads a file and accepts the marks.
export const VERIFIED_BLINK_RECORDING = null;

export function switchInputMode(current: InputMode, requested: InputMode, recordedReady: boolean): ModeSwitch {
  if (requested === "recorded" && !recordedReady) {
    return {
      mode: current,
      notice: "Recorded EEG stays off until you load a file and accept the candidate marks. No verified blink recording is bundled.",
      resetClock: false,
    };
  }
  if (requested === current) {
    return { mode: current, notice: null, resetClock: false };
  }
  if (requested === "manual") {
    return {
      mode: "manual",
      notice: "Manual demo. The highlight moves on a timer, and you press Select.",
      resetClock: true,
    };
  }
  if (requested === "live") {
    return {
      mode: "live",
      notice: "Live mode uses only samples that arrive from the bridge. A saved file is not shown as live. This path has not been tested with a Cyton.",
      resetClock: true,
    };
  }
  return {
    mode: "recorded",
    notice: "Recorded EEG. Selections follow candidate marks in the file you accepted. A mark is not a confirmed blink.",
    resetClock: true,
  };
}
