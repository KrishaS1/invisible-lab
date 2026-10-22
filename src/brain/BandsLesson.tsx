import { useState } from "react";
import { Badge } from "../components/Badge";
import { BandList } from "../components/BandList";
import { HeadMap } from "../components/HeadMap";
import { LoadState } from "../components/LoadState";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { Waveform } from "../components/Waveform";
import { Playback, usePlayback } from "../components/Playback";
import { useEeg } from "../data/useRecords";
import { BANDS, type BandName } from "../signal/bands";
import { HowTo } from "../components/HowTo";
import { Term } from "../components/Term";

export function BandsLesson() {
  const state = useEeg("S001R01");
  const record = state.record;
  const [channel, setChannel] = useState("O1");
  const [band, setBand] = useState<BandName>("alpha");
  const playback = usePlayback(record?.durationS ?? 1);
  const selected = BANDS.find((item) => item.id === band)!;

  return (
    <article>
      <h1>What rhythms are mixed into one recording?</h1>
      <p className="lede">
        One EEG line is a mix of slow and fast rhythms. <Term id="frequency">Frequency</Term> is how fast a rhythm repeats. <Term id="power">Power</Term> is how much of the recording sits in that range. Scientists sort the mix into five bands.
      </p>
      <HowTo
        steps={[
          "Click a dot on the head. The nose is at the top of the diagram.",
          "Pick a band. Alpha is 8–13 Hz, the rhythm from the eyes lesson.",
          "Compare the bars. The same minute can look different at the front and the back.",
          "Answer the check. Power is an amount, not a mood.",
        ]}
      />
      {!record ? (
        <LoadState error={state.error} name="S001R01" />
      ) : (
        <>
          <Badge origin="physionet" text="PhysioNet · S001R01 · eyes open · not a live recording" />
          <div className="split">
            <HeadMap active={channel} available={record.channels} onPick={setChannel} />
            <div>
              <div className="choice-row">
                {BANDS.map((item) => (
                  <button key={item.id} type="button" className={band === item.id ? "btn selected" : "btn"} onClick={() => setBand(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <p>
                <strong>{selected.label}</strong> is {selected.low}–{selected.high} Hz. {selected.blurb}
              </p>
              <p>
                On {channel}, absolute {selected.label.toLowerCase()} power is {record.bands[channel].absoluteUv2[band].toFixed(2)} µV², which is{" "}
                {(record.bands[channel].relative[band] * 100).toFixed(0)}% of the five-band total.
              </p>
            </div>
          </div>
          <BandList absolute={record.bands[channel].absoluteUv2} relative={record.bands[channel].relative} highlight={band} />
          <Waveform
            samples={record.samples[channel]}
            sfreq={record.sfreq}
            cursorS={playback.cursor}
            windowS={4}
            unit="µV"
            color="#2aa7b8"
            label={`${channel} · filtered recording`}
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
          <p className="quiet">The trace is the filtered voltage, not a single band. The bars are the split of that voltage into bands. Sampling rate {record.sfreq} Hz.</p>
          <SourceNote>{record.citation + " " + record.filter}</SourceNote>
        </>
      )}
      <Quiz
        lessonId="bands"
        prompt="Which statement is accurate?"
        options={[
          { id: "same", label: "Frequency and power are two words for the same thing" },
          { id: "diff", label: "Frequency is the speed of a rhythm. Power is how much signal is in that range" },
          { id: "mood", label: "Gamma power tells you the person's mood" },
        ]}
        answer="diff"
        explanation="A 10 Hz rhythm can be weak or strong. These bands are a teaching split of the spectrum, not a diagnosis."
      />
    </article>
  );
}
