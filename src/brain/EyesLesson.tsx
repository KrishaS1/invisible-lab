import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { LoadState } from "../components/LoadState";
import { Playback, usePlayback } from "../components/Playback";
import { Prediction } from "../components/Prediction";
import { Quiz } from "../components/Quiz";
import { SourceNote } from "../components/SourceNote";
import { PowerTimeline, Waveform } from "../components/Waveform";
import { posteriorAlpha } from "../data/loadRecords";
import { useEeg } from "../data/useRecords";
import { predictionFor } from "../progress/progress";
import { direction, percentChange } from "../signal/bpm";
import { formatPercent, formatPower } from "../signal/format";
import { HowTo } from "../components/HowTo";
import { Term } from "../components/Term";
import { Link } from "react-router-dom";

function sharedDomain(a: ArrayLike<number>, b: ArrayLike<number>): [number, number] {
  const all: number[] = [];
  for (let i = 0; i < a.length; i++) all.push(a[i]);
  for (let i = 0; i < b.length; i++) all.push(b[i]);
  all.sort((x, y) => x - y);
  const lo = all[0] ?? -50;
  const hi = all[all.length - 1] ?? 50;
  const pad = Math.max(5, (hi - lo) * 0.1);
  return [lo - pad, hi + pad];
}

export function EyesLesson() {
  const [subject, setSubject] = useState("S001");
  const [channel, setChannel] = useState("O1");
  const [guess, setGuess] = useState<string | null>(() => predictionFor("eyes"));
  const openState = useEeg(`${subject}R01`);
  const closedState = useEeg(`${subject}R02`);
  const open = openState.record;
  const closed = closedState.record;
  const playbackOpen = usePlayback(open?.durationS ?? 1);
  const playbackClosed = usePlayback(closed?.durationS ?? 1);

  const domain = useMemo(() => {
    if (!open || !closed || !open.samples[channel] || !closed.samples[channel]) return undefined;
    return sharedDomain(open.samples[channel], closed.samples[channel]);
  }, [open, closed, channel]);

  const openAlpha = open ? posteriorAlpha(open) : null;
  const closedAlpha = closed ? posteriorAlpha(closed) : null;
  const seen = openAlpha !== null && closedAlpha !== null ? direction(openAlpha, closedAlpha) : null;
  const change = openAlpha !== null && closedAlpha !== null ? percentChange(openAlpha, closedAlpha) : null;

  return (
    <article>
      <h1>What changes when someone closes their eyes?</h1>
      <p className="lede">
        Does closing your eyes quiet your brain, or change its rhythm? Make a prediction, then compare real recordings to discover what happens to <Term id="alpha">alpha</Term>, a brain rhythm measured at the back of the head.
      </p>
      <HowTo
        steps={[
          "Make a guess before you read the numbers.",
          "Play both recordings. Eyes open is above eyes closed. Both charts share a voltage scale.",
          "Compare alpha power from O1 and O2, at the back of the head.",
          "Answer the check. A surprising result is still a real recording.",
        ]}
      />

      <section>
        <h2>01 · Make your prediction</h2>
        <Prediction
          lessonId="eyes"
          prompt="When the eyes close, the alpha rhythm at the back of the head will:"
          options={[
            { id: "up", label: "Get stronger" },
            { id: "down", label: "Get weaker" },
            { id: "same", label: "Stay about the same" },
          ]}
          onChoose={setGuess}
        />
      </section>

      <section>
        <h2>02 · Run the experiment</h2>
        <p className="quiet">Press Play on each recording, then compare the wave heights. Both charts use the same scale.</p>
        <div className="choice-row">
          {["S001", "S002"].map((id) => (
            <button key={id} type="button" className={subject === id ? "btn selected" : "btn"} onClick={() => setSubject(id)}>
              Participant {id}
            </button>
          ))}
          {["O1", "O2"].map((id) => (
            <button key={id} type="button" className={channel === id ? "btn selected" : "btn"} onClick={() => setChannel(id)}>
              {id}
            </button>
          ))}
        </div>
        <p className="quiet">S001 and S002 are two people in a public dataset called PhysioNet. The eyes-open minute is called R01. The eyes-closed minute is R02. Stay on one person while you compare.</p>
        {!open || !closed ? (
          <LoadState error={openState.error ?? closedState.error} name={`${subject} baselines`} />
        ) : (
          <>
            <Badge origin="physionet" text={`PhysioNet · ${subject} · R01 eyes open and R02 eyes closed · not live`} />
            <Waveform
              samples={open.samples[channel]}
              sfreq={open.sfreq}
              cursorS={playbackOpen.cursor}
              windowS={4}
              unit="µV"
              color="#2aa7b8"
              label={`${channel} · eyes open`}
              yDomain={domain}
            />
            <Playback
              durationS={open.durationS}
              cursor={playbackOpen.cursor}
              playing={playbackOpen.playing}
              speed={playbackOpen.speed}
              onCursor={playbackOpen.setCursor}
              onPlaying={playbackOpen.setPlaying}
              onSpeed={playbackOpen.setSpeed}
              onRestart={playbackOpen.restart}
            />
            <Waveform
              samples={closed.samples[channel]}
              sfreq={closed.sfreq}
              cursorS={playbackClosed.cursor}
              windowS={4}
              unit="µV"
              color="#d08a3a"
              label={`${channel} · eyes closed`}
              yDomain={domain}
            />
            <Playback
              durationS={closed.durationS}
              cursor={playbackClosed.cursor}
              playing={playbackClosed.playing}
              speed={playbackClosed.speed}
              onCursor={playbackClosed.setCursor}
              onPlaying={playbackClosed.setPlaying}
              onSpeed={playbackClosed.setSpeed}
              onRestart={playbackClosed.restart}
            />
          </>
        )}
      </section>

      {guess && open && closed && openAlpha !== null && closedAlpha !== null && seen ? (
        <section>
          <h2>03 · Your discovery</h2>
          <div className="discovery-results"><div><small>Eyes open · Alpha power</small><strong>{formatPower(openAlpha)} <span>µV²</span></strong></div><div><small>Eyes closed · Alpha power</small><strong>{formatPower(closedAlpha)} <span>µV²</span></strong></div><div><small>Measured change</small><strong>{change === null ? "Unavailable" : formatPercent(change)}</strong></div></div>
          <p>
            Alpha here means the strength of the 8–13 Hz rhythm. The number is an average of O1 and O2. Eyes open {formatPower(openAlpha)} µV², eyes closed {formatPower(closedAlpha)} µV²
            {change === null ? "." : ` (${formatPercent(change)}).`} About the same means within 10%.
          </p>
          <p>
            {seen === "up" && "In this pair, posterior alpha was higher with eyes closed."}
            {seen === "down" && "In this pair, posterior alpha was lower with eyes closed. That can happen. Drowsiness, muscle tension, or a short sample can all move the number."}
            {seen === "same" && "In this pair, posterior alpha barely changed. The common pattern is an increase, and this recording does not show a clear one."}
            {guess
              ? ` You predicted ${guess === "up" ? "an increase" : guess === "down" ? "a decrease" : "little change"}. ${guess === seen ? "That matches this recording." : "This recording went a different way, and that is a real observation."}`
              : " Your prediction will show up here after you choose one."}
          </p>
          <details className="science-details"><summary>Go deeper: channel measurements and power over time</summary>
          <div className="table-wrap">
            <table>
              <caption>Absolute alpha power, in µV², and its share of the five bands.</caption>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Eyes open</th>
                  <th>Eyes closed</th>
                  <th>Open share</th>
                  <th>Closed share</th>
                </tr>
              </thead>
              <tbody>
                {["O1", "O2"].map((name) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{formatPower(open.bands[name].absoluteUv2.alpha)}</td>
                    <td>{formatPower(closed.bands[name].absoluteUv2.alpha)}</td>
                    <td>{(open.bands[name].relative.alpha * 100).toFixed(0)}%</td>
                    <td>{(closed.bands[name].relative.alpha * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PowerTimeline
            times={open.timeline.times}
            series={[{ name: "eyes open", values: open.timeline.absoluteUv2[channel].alpha }]}
            colors={["#2aa7b8"]}
            unit="µV²"
          />
          <PowerTimeline
            times={closed.timeline.times}
            series={[{ name: "eyes closed", values: closed.timeline.absoluteUv2[channel].alpha }]}
            colors={["#d08a3a"]}
            unit="µV²"
          />
          <p className="quiet">The two timelines are separate recordings. They are not lined up on one clock. Each point is one 4-second estimate, so it jumps around.</p>
          </details>
          {change !== null && Math.abs(change) >= 200 ? (
            <p>The closed-eye value is several times the open-eye value. A strong occipital rhythm can do that. The µV² numbers are the measurement. The percent is only their ratio.</p>
          ) : null}
        </section>
      ) : null}

      {!guess ? <p className="result-note">Choose a prediction above to unlock your measured results. Every guess is a useful starting point.</p> : null}
      <section>
        <h2>04 · Connect the dots</h2>
        <p>
          With eyes open, the visual cortex is busy with the scene in front of you. When the eyes close and the person stays awake, many people show a stronger 8–13 Hz rhythm over the back of the head. That rhythm is alpha. It is a description of the voltage, not a reading of mood, focus, or intelligence.
        </p>
        <p>Absolute power is the amount of signal in the band. Relative power is that amount divided by the five bands on this page. Relative alpha can rise because alpha grew or because the other bands shrank.</p>
      </section>

      <p>Next, open <Link to="/brain/bands">brain waves</Link> to see the other rhythms in one of these recordings, or go to the <Link to="/heart/rate">heart lab</Link>.</p>
      <Quiz
        lessonId="eyes"
        prompt="Where is the eyes-closed alpha change usually largest?"
        options={[
          { id: "front", label: "Forehead" },
          { id: "back", label: "Back of the head" },
          { id: "ear", label: "The earlobes, which are the signal itself" },
        ]}
        answer="back"
        explanation="O1 and O2 sit over the occipital lobe, at the back. One recording can still fail to show the increase."
      />
      {open ? <SourceNote>{`${open.citation} Sampling rate ${open.sfreq} Hz. ${open.filter}`}</SourceNote> : null}
    </article>
  );
}
