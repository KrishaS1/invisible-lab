import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export function usePlayback(durationS: number) {
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const cursorRef = useRef(0);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    if (!playing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const id = window.setInterval(() => {
        const next = cursorRef.current + 0.5 * speed;
        if (next >= durationS) {
          cursorRef.current = 0;
          setCursor(0);
          setPlaying(false);
          return;
        }
        cursorRef.current = next;
        setCursor(next);
      }, 500);
      return () => window.clearInterval(id);
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = cursorRef.current + ((now - last) / 1000) * speed;
      last = now;
      if (next >= durationS) {
        cursorRef.current = 0;
        setCursor(0);
        setPlaying(false);
        return;
      }
      cursorRef.current = next;
      setCursor(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, durationS]);

  function restart() {
    cursorRef.current = 0;
    setCursor(0);
    setPlaying(false);
  }

  return { cursor, setCursor, playing, setPlaying, speed, setSpeed, restart };
}

export function Playback({
  durationS,
  cursor,
  playing,
  speed,
  onCursor,
  onPlaying,
  onSpeed,
  onRestart,
}: {
  durationS: number;
  cursor: number;
  playing: boolean;
  speed: number;
  onCursor: (seconds: number) => void;
  onPlaying: (playing: boolean) => void;
  onSpeed: (speed: number) => void;
  onRestart: () => void;
}) {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === " " || event.key === "Enter") {
      if ((event.target as HTMLElement).tagName === "BUTTON") return;
      event.preventDefault();
      onPlaying(!playing);
    }
  }

  return (
    <div className="playback" tabIndex={0} onKeyDown={onKeyDown}>
      <button type="button" className="btn" onClick={() => onPlaying(!playing)}>
        {playing ? "Pause" : "Play"}
      </button>
      <button type="button" className="btn" onClick={onRestart}>
        Restart
      </button>
      <label className="speed">
        Speed
        <select value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
        </select>
      </label>
      <input
        className="scrub"
        type="range"
        min={0}
        max={durationS}
        step={0.05}
        value={Math.min(cursor, durationS)}
        aria-label="Recording time"
        onChange={(event) => onCursor(Number(event.target.value))}
      />
      <span className="time-readout">
        {cursor.toFixed(1)} s / {durationS.toFixed(1)} s
      </span>
    </div>
  );
}
