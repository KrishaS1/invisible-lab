import { useEffect, useMemo, useRef, useState } from "react";
import { pitchFromAlpha, startTone, type ToneHandle } from "../audio/tones";
import { Badge } from "../components/Badge";
import { LoadState } from "../components/LoadState";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { useEeg } from "../data/useRecords";
import { useSession } from "./session";

export function ListenLesson() {
  const state = useEeg("S001R02");
  const record = state.record;
  const { recording } = useSession();
  const [source, setSource] = useState<"physionet" | "upload">("physionet");
  const mounted = useRef(true);
  const [starting, setStarting] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [volume, setVolume] = useState(0.12);
  const [index, setIndex] = useState(0);
  const [handle, setHandle] = useState<ToneHandle | null>(null);

  const uploadedAlpha = recording?.timeline.O1?.absoluteUv2.alpha ?? recording?.timeline.O2?.absoluteUv2.alpha ?? null;
  const physAlpha = useMemo(() => record ? record.timeline.absoluteUv2.O1.alpha.map((value, i) => (value + record.timeline.absoluteUv2.O2.alpha[i]) / 2) : null, [record]);
  const series = source === "upload" ? uploadedAlpha : physAlpha;
  const current = series && series.length > 0 ? series[Math.min(index, series.length - 1)] : null;
  const min = series && series.length ? Math.min(...series) : 0;
  const max = series && series.length ? Math.max(...series) : 1;

  useEffect(() => {
    if (!on || current === null) return;
    handle?.setPitch(pitchFromAlpha(current, min, max));
    handle?.setVolume(volume);
  }, [on, current, min, max, volume, handle]);

  useEffect(() => {
    if (!on || !series || series.length === 0) return;
    const id = window.setInterval(() => {
      setIndex((value) => (value + 1) % series.length);
    }, 400);
    return () => window.clearInterval(id);
  }, [on, series]);

  useEffect(() => {
    return () => handle?.stop();
  }, [handle]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => { setIndex(0); }, [source]);

  async function toggle() {
    if (on) {
      handle?.stop();
      setHandle(null);
      setOn(false);
      return;
    }
    setStarting(true);
    setAudioError(null);
    try {
      const next = await startTone(volume);
      if (!mounted.current) { next.stop(); return; }
      setHandle(next);
      setOn(true);
    } catch (error) {
      if (mounted.current) setAudioError(error instanceof Error ? error.message : "Unable to start audio.");
    } finally {
      if (mounted.current) setStarting(false);
    }
  }

  return (
    <article>
      <h1>Can a number become a tone?</h1>
      <p className="lede">Press the button to start the sound. The pitch rises when alpha power in the window rises. The browser made the tone. The brain did not produce that sound.</p>
      <p>Use the PhysioNet recording below, then press Start listening. Watch the bar while you listen. If the pitch changes, the alpha number changed. The bar is there so you can follow along with the sound off.</p>
      <div className="choice-row">
        <button type="button" className={source === "physionet" ? "btn selected" : "btn"} onClick={() => setSource("physionet")}>
          PhysioNet eyes closed
        </button>
        <button type="button" className={source === "upload" ? "btn selected" : "btn"} disabled={!recording} onClick={() => setSource("upload")}>
          {recording ? `Uploaded · ${recording.fileName}` : "No upload yet"}
        </button>
      </div>
      {source === "physionet" && !record ? <LoadState error={state.error} name="S001R02" /> : null}
      {series && current !== null ? (
        <>
          <Badge
            origin={source === "upload" ? recording!.origin : "physionet"}
            text={
              source === "upload"
                ? `${recording!.origin === "live" ? "Live capture" : "Uploaded file"} · ${recording!.fileName}`
                : "PhysioNet · S001R02 · eyes closed · synthesized tone"
            }
          />
          <div className="meter" aria-hidden="true">
            <div style={{ width: `${((current - min) / Math.max(max - min, 1e-9)) * 100}%` }} />
          </div>
          <p>
            Alpha power at this step: {current.toFixed(2)} µV². Pitch: {pitchFromAlpha(current, min, max).toFixed(0)} Hz. The lowest alpha in this series is {min.toFixed(2)} and the highest is {max.toFixed(2)}. The slider only changes loudness.
          </p>
          <div className="choice-row">
            <button type="button" className="btn primary" onClick={toggle} disabled={starting} aria-pressed={on}>
              {starting ? "Starting audio…" : on ? "Stop sound" : "▶ Start listening"}
            </button>
            <label className="speed">
              Volume
              <input type="range" min={0} max={0.3} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
            </label>
          </div>
          <p role="status" className="quiet">{audioError ?? (starting ? "Waiting for browser audio permission. If this does not start, try Chrome or Edge." : on ? volume === 0 ? "Sound is muted: raise the volume slider." : "Audio engine running. You should hear a continuous tone. If silent, check your system volume and whether this tab is muted." : "Sound is off. Press Start listening to hear the brainwave tone.")}</p>
          <p className="quiet">If you cannot use audio, the bar and the numbers are the same information. Step {index + 1} of {series.length}, one step every 0.4 s while the sound is on.</p>
        </>
      ) : null}
      <Quiz
        lessonId="listen"
        prompt="What is the tone?"
        options={[
          { id: "brain", label: "A microphone recording of the brain" },
          { id: "map", label: "A tone whose pitch follows measured alpha power" },
          { id: "heart", label: "The sound of blood flow" },
        ]}
        answer="map"
        explanation="The oscillator is created with the Web Audio API. Alpha power only chooses the pitch."
      />
      {record ? <SourceNote>{record.citation}</SourceNote> : null}
    </article>
  );
}
