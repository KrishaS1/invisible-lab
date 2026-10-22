export const BRIDGE_URL = "ws://127.0.0.1:8765";
export const LIVE_BRIDGE_TESTED = false;

export type BridgeMessage =
  | { type: "hello"; brainflow: boolean; testedWithHardware: boolean }
  | { type: "ports"; ports: string[] }
  | { type: "status"; state: string; detail: string }
  | { type: "samples"; sfreq: number; chunk: number[][] }
  | { type: "error"; message: string };

export function hostedPageBlocksBridge(): boolean {
  return window.location.protocol === "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
}
