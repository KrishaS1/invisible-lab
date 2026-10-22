import { useEffect, useRef, useState } from "react";
import { startHeartAudio, type HeartAudio } from "../audio/tones";
import { Badge } from "../components/Badge";
import { LoadState } from "../components/LoadState";
import { Playback, usePlayback } from "../components/Playback";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { Waveform } from "../components/Waveform";
import { useHeartSelection } from "./useHeart";

export function HeartListenLesson() {
  const heart = useHeartSelection();
  const record = heart.record;
  const playback = usePlayback(record?.durationS ?? 1);
  const [volume, setVolume] = useState(0.2);
  const [armed, setArmed] = useState(false);
  const audio = useRef<HeartAudio | null>(null);
  const mounted = useRef(true);
  const [starting, setStarting] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const previousTime = useRef(0);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; audio.current?.stop(); };
  }, []);

  useEffect(() => {
    const before = previousTime.current;
    previousTime.current = playback.cursor;
    if (!armed || !playback.playing || !record || playback.cursor <= before) return;
    // Include the first marked beat, and re-arm naturally after a rewind.
    const crossed = heart.peaks.some(index => {
      const time = index / record.sfreq;
      return time > before && time <= playback.cursor;
    });
    if (crossed) audio.current?.thump(volumeRef.current);
  }, [armed, playback.playing, playback.cursor, record, heart.peaks]);

  async function enableAudio(testOnly = false) {
    setStarting(true);
    setAudioError(null);
    try {
      const next = audio.current ?? await startHeartAudio();
      if (!mounted.current) { next.stop(); return; }
      audio.current = next;
      if (testOnly) next.thump(volume);
      else {
        previousTime.current = playback.cursor;
        setArmed(true);
        playback.setPlaying(true);
      }
    } catch (error) {
      if (mounted.current) setAudioError(error instanceof Error ? error.message : "Unable to start audio.");
    } finally {
      if (mounted.current) setStarting(false);
    }
  }

  function stopAudio() {
    setArmed(false);
    playback.setPlaying(false);
    audio.current?.stop();
    audio.current = null;
  }

  return (
    <article>
      <h1>Can you hear the timing?</h1>
      <p className="lede">Press Start listening to play the recording with a pulse at each marked heartbeat. Use Test sound to check your speakers. The browser made the click. There is no microphone on the chest. Leave the sound off if you only want to watch the line.</p>
      <p className="result-note">Invisible Lab is not a medical device.</p>
      {!record && !heart.error ? <LoadState error={heart.catalogError} name="an ECG" /> : null}
      {heart.error ? <p className="result-note">{heart.error}</p> : null}
      {record ? (
        <>
          <Badge origin="physionet" text={`PhysioNet ECG-ID · ${record.id} · clicks follow detected or annotated R peaks`} />
          <Waveform
            samples={record.samples}
            sfreq={record.sfreq}
            cursorS={playback.cursor}
            windowS={5}
            unit={record.unit}
            color="#3c9d6e"
            label={record.lead}
            peaks={heart.peaks}
          />
          <Playback
            durationS={record.durationS}
            cursor={playback.cursor}
            playing={playback.playing}
            speed={playback.speed}
            onCursor={playback.setCursor}
            onPlaying={playback.setPlaying}
            onSpeed={playback.setSpeed}
            onRestart={playback.restart}
          />
          <div className="choice-row">
            <button type="button" className="btn ecg" disabled={starting} aria-pressed={armed} onClick={() => armed ? stopAudio() : void enableAudio()}>
              {starting ? "Starting audio…" : armed ? "Stop listening" : "▶ Start listening"}
            </button>
            <button type="button" className="btn" disabled={starting} onClick={() => void enableAudio(true)}>Test sound</button>
            <label className="speed">
              Volume
              <input type="range" min={0.02} max={0.35} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
            </label>
          </div>
          <p className="quiet" role="status">{audioError ?? (starting ? "Waiting for browser audio permission. If this does not start, try Chrome or Edge." : armed ? playback.playing ? "Listening: pulses follow the marked beats. If silent, check system volume and whether this tab is muted." : "Recording paused. Press Play to continue hearing the marked beats." : "Sound is off. Start listening plays the recording and enables audio together.")}</p>
          <p className="quiet">
            {heart.peaks.length} peaks. Median rate {record.medianBpm ?? "—"} bpm. The trace itself is the visual alternative if you leave the sound off.
          </p>
          <SourceNote>{record.citation}</SourceNote>
        </>
      ) : null}
      <Quiz
        lessonId="heart-listen"
        prompt="What do the clicks line up with?"
        options={[
          { id: "r", label: "R peaks in this recording" },
          { id: "mic", label: "A stethoscope recording" },
          { id: "random", label: "A steady metronome that ignores the file" },
        ]}
        answer="r"
        explanation="Each click is scheduled from a peak time in this ECG. If the detector missed a beat, the click would miss it too. Annotated files use the file's marks."
      />
    </article>
  );
}
