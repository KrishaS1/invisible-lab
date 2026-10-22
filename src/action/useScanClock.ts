import { useEffect, useState } from "react";

export function useScanClock(dwellMs: number, resetKey: string) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    setElapsedMs(0);
    const id = window.setInterval(() => {
      setElapsedMs((value) => value + dwellMs);
    }, dwellMs);
    return () => window.clearInterval(id);
  }, [dwellMs, resetKey]);

  return elapsedMs;
}
