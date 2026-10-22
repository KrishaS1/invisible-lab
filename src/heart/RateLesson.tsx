import { useState } from "react";
import { Badge } from "../components/Badge";
import { LoadState } from "../components/LoadState";
import { Playback, usePlayback } from "../components/Playback";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { Waveform } from "../components/Waveform";
import { HowTo } from "../components/HowTo";
import { Term } from "../components/Term";
import { Link } from "react-router-dom";
import { bpmFromRrSeconds } from "../signal/bpm";
import { formatBpm, formatSeconds } from "../signal/format";
import { useHeartSelection } from "./useHeart";

export function RateLesson() {
  const heart = useHeartSelection();
  const record = heart.record;
  const playback = usePlayback(record?.durationS ?? 1);
  const [first, setFirst] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState<number | null>(null);

  const pair = first !== null && second !== null ? [Math.min(first, second), Math.max(first, second)] : null;
  const rr = record && pair ? (pair[1] - pair[0]) / record.sfreq : null;
  const bpm = rr ? bpmFromRrSeconds(rr) : null;
  const peakPos = record && pair ? heart.peaks.indexOf(pair[0]) : -1;
  const nextPos = record && pair ? heart.peaks.indexOf(pair[1]) : -1;
  const adjacent = peakPos >= 0 && nextPos === peakPos + 1;

  return (
    <article>
      <h1>How fast is this heart beating?</h1>
      <p className="lede">
        Each tall spike is one heartbeat. The time from one spike to the next is one beat. Divide 60 by that time in seconds and you get beats per minute. These numbers are for learning. This is not a medical device, and it does not diagnose anyone.
      </p>
      <HowTo
        steps={[
          "Press play and watch the tall spikes. Those are the R peaks.",
          "Pick two spikes that sit next to each other in time.",
          "Divide 60 by the seconds between them. Type that number.",
          "Press the button and compare your division with the page.",
        ]}
      />
      {heart.catalogError || heart.error ? <LoadState error={heart.catalogError ?? heart.error} name="an ECG" /> : null}
      {!record && !heart.catalogError && !heart.error ? <LoadState error={null} name="an ECG recording" /> : null}
      {record && heart.catalog ? (
        <>
          <div className="choice-row">
            {heart.catalog.ecg.map((item) => (
              <button key={item.id} type="button" className={item.id === heart.id ? "btn selected" : "btn"} onClick={() => { heart.setId(item.id); setFirst(null); setSecond(null); setSubmitted(null); }}>
                {item.person}
              </button>
            ))}
          </div>
          <Badge origin="physionet" text={`PhysioNet ECG-ID · ${record.person} ${record.record} · ${record.lead} · not a diagnosis`} />
          <p className="quiet">Lead I looks across the heart from the right arm toward the left arm. The dashed lines are beats the file already marked ({record.annotatedRPeaks.length} of them). Gaps are normal: the file did not mark every beat in the 20 seconds. Use the marks on the chart, not a second list.</p>
          <Waveform
            samples={record.samples}
            sfreq={record.sfreq}
            cursorS={playback.cursor}
            windowS={5}
            unit={record.unit}
            color="#3c9d6e"
            label={`${record.lead} · R peaks marked`}
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
          <h2>Your turn: choose two neighboring beats</h2>
          <div className="peak-selection" aria-live="polite"><span className={first !== null ? "picked" : ""}>1 · {first === null ? "Choose the first beat" : `${(first / record.sfreq).toFixed(2)} s selected`}</span><span className={second !== null ? "picked" : ""}>2 · {second === null ? "Choose its neighbor" : `${(second / record.sfreq).toFixed(2)} s selected`}</span>{first !== null && <button type="button" className="btn" onClick={() => {setFirst(null);setSecond(null);setTyped("");setSubmitted(null);}}>Clear pair</button>}</div>
          <p>Click two times below the chart. The tall spikes are called <Term id="rpeak">R peaks</Term>. Neighbors give one beat. If you skip a spike, the page will say the interval covers more than one beat.</p>
          <div className="choice-row wrap">
            {heart.peaks.map((index) => {
              const selected = index === first || index === second;
              return (
                <button
                  key={index}
                  type="button"
                  className={selected ? "btn selected" : "btn"}
                  aria-pressed={selected}
                  onClick={() => {
                    setSubmitted(null);
                    if (first === null || (first !== null && second !== null)) {
                      setFirst(index);
                      setSecond(null);
                      return;
                    }
                    setSecond(index);
                  }}
                >
                  {(index / record.sfreq).toFixed(2)} s
                </button>
              );
            })}
          </div>
          {rr !== null && bpm !== null && pair ? (
            <div className="math">
              <p>t1 = {formatSeconds(pair[0] / record.sfreq)} s</p>
              <p>t2 = {formatSeconds(pair[1] / record.sfreq)} s</p>
              <p>R–R = {formatSeconds(pair[1] / record.sfreq)} − {formatSeconds(pair[0] / record.sfreq)} = {formatSeconds(rr)} s</p>
              {!adjacent ? <p>Those peaks are not neighbors. Clear the pair and pick two consecutive times to calculate one beat interval.</p> : null}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = Number(typed);
                  if (Number.isFinite(value)) setSubmitted(value);
                }}
              >
                <label>
                  What heart rate is that, in beats per minute?
                  <input type="number" min="1" step="any" required value={typed} onChange={(event) => setTyped(event.target.value)} inputMode="decimal" />
                </label>
                <button type="submit" className="btn primary" disabled={!adjacent}>Check the division</button>
              </form>
              {submitted !== null ? (
                <p>
                  60 / {formatSeconds(rr)} = {formatBpm(bpm)}. You entered {formatBpm(submitted)}.
                  {Math.abs(submitted - bpm) <= 1 ? " That matches, allowing for rounding." : ` The difference is ${formatBpm(Math.abs(submitted - bpm))} bpm.`}
                  {record.medianBpm !== null ? ` The median rate across neighboring peaks in this file is ${formatBpm(record.medianBpm)} bpm.` : ""}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="quiet">Select a first peak, then a second one.</p>
          )}
          <SourceNote>{`${record.citation} Sampling rate ${record.sfreq} Hz. Unit ${record.unit}.`}</SourceNote>
        </>
      ) : null}
      <p>Next, look at <Link to="/heart/beat">one heartbeat</Link> up close.</p>
      <Quiz
        lessonId="heart-rate"
        prompt="A neighboring pair of R peaks is 0.80 seconds apart. What is the rate for that pair?"
        options={[
          { id: "48", label: "48 bpm" },
          { id: "75", label: "75 bpm" },
          { id: "80", label: "80 bpm" },
        ]}
        answer="75"
        explanation="60 / 0.80 = 75. That is one pair, not a diagnosis, and the next pair can differ."
      />
    </article>
  );
}
