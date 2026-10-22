import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { LoadState } from "../components/LoadState";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { PowerTimeline } from "../components/Waveform";
import { useEeg } from "../data/useRecords";
import type { EegRecord } from "../data/types";
import { welchBands } from "../signal/welch";
import { formatPower } from "../signal/format";

const RUNS = [
  { id: "S001R03", title: "Real fist movement" },
  { id: "S001R04", title: "Imagined fist movement" },
];

function meanAlpha(record: EegRecord, channel: string, label: string): number | null {
  const pieces: number[] = [];
  const { samples, sfreq, annotations } = record;
  const data = samples[channel];
  if (!data) return null;
  for (const event of annotations) {
    if (event.label !== label || event.duration < 2) continue;
    const lo = Math.round(event.onset * sfreq);
    const hi = Math.round((event.onset + event.duration) * sfreq);
    const slice = data.slice(lo, hi);
    if (slice.length < sfreq * 2) continue;
    pieces.push(welchBands(slice, sfreq, 2).alpha.absoluteUv2);
  }
  if (pieces.length === 0) return null;
  return pieces.reduce((sum, value) => sum + value, 0) / pieces.length;
}

export function MovementLesson() {
  const [run, setRun] = useState("S001R03");
  const state = useEeg(run);
  const record = state.record;
  const table = useMemo(() => {
    if (!record) return [];
    return ["C3", "C4"].map((channel) => ({
      channel,
      rest: meanAlpha(record, channel, "T0"),
      left: meanAlpha(record, channel, "T1"),
      right: meanAlpha(record, channel, "T2"),
    }));
  }, [record]);

  return (
    <article>
      <h1>What was this person asked to do?</h1>
      <p className="lede">
        In this recording a person was asked to open and close a fist, or only to imagine it. The colored bars are those instructions from the file. This page does not guess which hand moved. It shows the recording next to the instructions.
      </p>
      <div className="choice-row">
        {RUNS.map((item) => (
          <button key={item.id} type="button" className={run === item.id ? "btn selected" : "btn"} onClick={() => setRun(item.id)}>
            {item.title}
          </button>
        ))}
      </div>
      {!record ? (
        <LoadState error={state.error} name={run} />
      ) : (
        <>
          <Badge origin="physionet" text={`PhysioNet · ${record.id} · ${record.condition} · labels depend on this run`} />
          <p>
            In {record.id}, T0 means rest
            {record.run === "R03"
              ? ", T1 means opening and closing the left fist, and T2 means opening and closing the right fist."
              : ", T1 means imagining the left fist, and T2 means imagining the right fist."}{" "}
            Those codes do not keep that meaning in every PhysioNet run.
          </p>
          <div className="event-track" aria-hidden="true">
            {record.annotations.map((event, index) => (
              <span
                key={`${event.onset}-${index}`}
                className={`event event-${event.label}`}
                style={{
                  left: `${(event.onset / record.durationS) * 100}%`,
                  width: `${Math.max(0.4, (event.duration / record.durationS) * 100)}%`,
                }}
                title={`${event.label}: ${event.meaning}`}
              />
            ))}
          </div>
          <ul className="legend">
            {[...new Map(record.annotations.map((event) => [event.label, event.meaning])).entries()].map(([label, meaning]) => (
              <li key={label}>
                <span className={`swatch event-${label}`} /> {label}: {meaning}
              </li>
            ))}
          </ul>
          <PowerTimeline
            times={record.timeline.times}
            series={[
              { name: "C3", values: record.timeline.absoluteUv2.C3.alpha },
              { name: "C4", values: record.timeline.absoluteUv2.C4.alpha },
            ]}
            colors={["#2aa7b8", "#d08a3a"]}
            unit="µV² of 8–13 Hz"
          />
          <div className="table-wrap">
            <table>
              <caption>Mean 8–13 Hz power during each kind of interval, in µV². Each interval is measured on its own, then averaged.</caption>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Rest (T0)</th>
                  <th>T1</th>
                  <th>T2</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row) => (
                  <tr key={row.channel}>
                    <td>{row.channel}</td>
                    <td>{row.rest === null ? "—" : formatPower(row.rest)}</td>
                    <td>{row.left === null ? "—" : formatPower(row.left)}</td>
                    <td>{row.right === null ? "—" : formatPower(row.right)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Movement often reduces 8–12 Hz activity over the motor cortex. Researchers call that event-related desynchronization. The band on this page is the same 8–13 Hz alpha band used elsewhere, measured at C3 and C4 rather than at the back of the head. If a cell in the table is not lower during movement, that is still a valid result. EEG is noisy, and one person is not a decoder.
          </p>
          <SourceNote>{record.citation}</SourceNote>
        </>
      )}
      <Quiz
        lessonId="movement"
        prompt="What does this page refuse to do?"
        options={[
          { id: "guess", label: "Guess left hand versus right hand from the EEG" },
          { id: "show", label: "Show the task labels that came with the file" },
          { id: "rest", label: "Compare rest intervals with movement intervals" },
        ]}
        answer="guess"
        explanation="A classifier would be a different project. Here the labels come from the recording, and the numbers are measurements."
      />
    </article>
  );
}
