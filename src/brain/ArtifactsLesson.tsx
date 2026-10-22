import { Badge } from "../components/Badge";
import { LoadState } from "../components/LoadState";
import { Playback, usePlayback } from "../components/Playback";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { Waveform } from "../components/Waveform";
import { useEeg } from "../data/useRecords";
import { Term } from "../components/Term";

export function ArtifactsLesson() {
  const state = useEeg("S001R01");
  const record = state.record;
  const playback = usePlayback(record?.durationS ?? 1);

  return (
    <article>
      <h1>When is a bump not a brain rhythm?</h1>
      <p className="lede">
        An <Term id="artifact">artifact</Term> is voltage from something other than the brain rhythm you meant to study. A blink, an eye movement, or a clenched jaw can be larger than the brain signal. Look at the sketch first, then at the real file.
      </p>
      <figure className="sketch">
        <figcaption>Sketch of a typical blink, not a recording</figcaption>
        <svg viewBox="0 0 320 80" role="img" aria-label="A drawn blink: a flat line, one tall slow bump, then flat again">
          <path d="M8 50 H90 C110 50 120 18 140 18 C160 18 170 50 190 50 H312" fill="none" stroke="#d08a3a" strokeWidth="2" />
        </svg>
        <p>A blink is often a tall, slow bump, biggest near the forehead. This drawing is only a shape. It is not data.</p>
      </figure>
      {!record ? (
        <LoadState error={state.error} name="S001R01" />
      ) : (
        <>
          <Badge origin="physionet" text="PhysioNet · S001R01 · eyes open · no blink labels in this file" />
          <p className="result-note">
            Nothing on these traces is marked as a blink. The baseline runs are not blink-annotated, and this page will not invent marks.
          </p>
          <Waveform samples={record.samples.Fp1} sfreq={record.sfreq} cursorS={playback.cursor} windowS={4} unit="µV" color="#d08a3a" label="Fp1 · forehead" />
          <Waveform samples={record.samples.O1} sfreq={record.sfreq} cursorS={playback.cursor} windowS={4} unit="µV" color="#2aa7b8" label="O1 · back of the head" />
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
          <p>
            Fp1 and O1 are playing the same stretch of time. Forehead electrodes pick up blinks more strongly. Occipital electrodes pick up posterior alpha more strongly. A spike can still be a blink, a muscle burst, or a bad contact. The file does not say which.
          </p>
          <p>If you record with the Cyton, a blink on purpose will usually dwarf the brain rhythm. Upload that file on the Upload page and look at the forehead channels. Still do not let a program name the blink unless you can defend the rule.</p>
          <SourceNote>{record.citation}</SourceNote>
        </>
      )}
      <Quiz
        lessonId="artifacts"
        prompt="Why does this page leave the PhysioNet trace unmarked?"
        options={[
          { id: "none", label: "The baseline file does not come with blink labels" },
          { id: "clean", label: "PhysioNet EEG never contains artifacts" },
          { id: "auto", label: "The app already removed every blink" },
        ]}
        answer="none"
        explanation="Marking blinks that were never annotated would be inventing data. The sketch above is labeled as a sketch."
      />
    </article>
  );
}
