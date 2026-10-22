import { createContext, useContext, useState, type ReactNode } from "react";
import type { BandName } from "../signal/bands";
import type { Timeline } from "../signal/welch";

export type AnalyzedUpload = {
  origin: "upload" | "live";
  fileName: string;
  sfreq: number;
  unit: "uV";
  channels: string[];
  samples: Record<string, number[]>;
  durationS: number;
  bands: Record<string, { absoluteUv2: Record<BandName, number>; relative: Record<BandName, number> }>;
  timeline: Record<string, Timeline>;
  warnings: string[];
};

type SessionValue = {
  recording: AnalyzedUpload | null;
  setRecording: (recording: AnalyzedUpload | null) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [recording, setRecording] = useState<AnalyzedUpload | null>(null);
  return <SessionContext.Provider value={{ recording, setRecording }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
