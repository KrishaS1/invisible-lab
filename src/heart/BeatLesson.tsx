import { Badge } from "../components/Badge";
import { LoadState } from "../components/LoadState";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { Waveform } from "../components/Waveform";
import { useHeartSelection } from "./useHeart";

const PARTS = [
  { id: "p", name: "P wave", text: "The atria depolarize. This dataset does not mark P waves, so the page does not drop a P marker on the trace." },
  { id: "qrs", name: "QRS complex", text: "The ventricles depolarize. Q and S here are the low points just before and after the annotated R peak, within 80 ms. They are a reading rule, not a second annotation file." },
  { id: "t", name: "T wave", text: "The ventricles reset electrically. When this file marks a T peak on the chosen beat, it is shown. The ECG-ID notes say those marks came from an automatic detector and were not audited." },
];

export function BeatLesson() {
  const heart = useHeartSelection();
  const record = heart.record;
  const beat = record?.exampleBeat ?? null;
  const slice = record && beat ? record.samples.slice(beat.viewStart, beat.viewEnd) : [];
  const shift = beat?.viewStart ?? 0;

  return (
    <article>
      <h1>What are the parts of one heartbeat?</h1>
      <p className="lede">This is one real beat, stretched out. The heart's electrical cycle has named stages. P starts the upper chambers, QRS is the tall spike from the lower chambers, and T is the reset. The file did not mark a P wave, so this page does not invent one.</p>
      <p>Find the tall spike first. That is QRS. The bump after it is T. A P wave would be a small bump before the spike. This file does not mark P, so do not look for a dot there.</p>
      {!record && !heart.error ? <LoadState error={heart.catalogError} name="an ECG" /> : null}
      {heart.error ? <LoadState error={heart.error} name="an ECG" /> : null}
      {record && beat ? (
        <>
          <Badge origin="physionet" text={`PhysioNet ECG-ID · ${record.id} · one annotated beat`} />
          <Waveform
            samples={slice}
            sfreq={record.sfreq}
            cursorS={0}
            windowS={slice.length / record.sfreq}
            unit={record.unit}
            color="#3c9d6e"
            label="One beat from the filtered lead stored in the file"
            peaks={[beat.rIndex - shift, ...(beat.tIndex !== null ? [beat.tIndex - shift] : [])]}
          />
          <ul className="legend">
            <li>R at {((beat.rIndex) / record.sfreq).toFixed(3)} s, from the beat annotation.</li>
            <li>Q at {(beat.qIndex / record.sfreq).toFixed(3)} s and S at {(beat.sIndex / record.sfreq).toFixed(3)} s, the nearby low points.</li>
            <li>{beat.tIndex === null ? "No T annotation landed on this beat." : `T annotation at ${(beat.tIndex / record.sfreq).toFixed(3)} s.`}</li>
          </ul>
          {PARTS.map((part) => (
            <section key={part.id}>
              <h2>{part.name}</h2>
              <p>{part.text}</p>
            </section>
          ))}
          <p className="quiet">{beat.markMethod}</p>
          <SourceNote>{record.citation}</SourceNote>
        </>
      ) : null}
      <Quiz
        lessonId="heart-beat"
        prompt="Which part is the tall spike that starts the ventricular squeeze?"
        options={[
          { id: "p", label: "P wave" },
          { id: "r", label: "R peak, inside the QRS" },
          { id: "t", label: "T wave" },
        ]}
        answer="r"
        explanation="The P wave is atrial. The T wave is the ventricles resetting. The R peak sits in the QRS."
      />
    </article>
  );
}
