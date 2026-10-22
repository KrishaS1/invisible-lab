import { LearnMore } from "../components/LearnMore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Playback, usePlayback } from "../components/Playback";
import { Prediction } from "../components/Prediction";
import { Quiz } from "../components/Quiz";
import { Waveform } from "../components/Waveform";
import { BRIDGE_URL, hostedPageBlocksBridge, LIVE_BRIDGE_TESTED, type BridgeMessage } from "../openbci/liveClient";
import { CYTON_MONTAGE, parseOpenBciCsv, samplesFromTable, type ParsedTable, type UnitsChoice } from "../openbci/parseCsv";
import { FILTER_LOW_HZ, filterHighHz } from "../signal/bands";
import { bandpass } from "../signal/filter";
import { analyzeChannels } from "../signal/analyze";
import { HowTo } from "../components/HowTo";
import { actionApps } from "./apps";
import { blinkChannelNote, DEFAULT_BLINK_SETTINGS, detectCandidateEvents, type BlinkSettings, type CandidateEvent } from "./blinkDetect";
import { switchInputMode, type InputMode } from "./modes";
import { ScanBoard } from "./ScanBoard";
import { activateSelection, highlightIndex, SCAN_OPTIONS, type ScanSource, type Selection } from "./scanner";
import { useScanClock } from "./useScanClock";

const ELECTRODE_OPTIONS = ["", ...CYTON_MONTAGE, "Fp1", "Fp2", "F3", "F4", "Fz"];

type Recording = {
  fileName: string;
  sfreq: number;
  channels: string[];
  samples: Record<string, number[]>;
  warnings: string[];
};

type LiveBuffer = {
  channels: number[][];
  dropped: number;
  sfreq: number;
};

const emptyLive: LiveBuffer = { channels: [], dropped: 0, sfreq: 250 };

export function BlinkPage() {
  const [mode, setMode] = useState<InputMode>("manual");
  const [notice, setNotice] = useState<string | null>(
    "Manual demo. The highlight moves on a timer, and you press Select.",
  );
  const [dwell, setDwell] = useState(1200);
  const [clockKey, setClockKey] = useState(0);
  const elapsed = useScanClock(dwell, `${mode}:${clockKey}`);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  const [log, setLog] = useState<Selection[]>([]);
  const [lastChoice, setLastChoice] = useState<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const chooseRef = useRef<(source: ScanSource) => void>(() => {});

  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [fileName, setFileName] = useState("");
  const [electrodes, setElectrodes] = useState<string[]>([]);
  const [sfreq, setSfreq] = useState(250);
  const [unit, setUnit] = useState<UnitsChoice>("uV");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [channel, setChannel] = useState("C3");
  const [accepted, setAccepted] = useState(false);
  const [settings, setSettings] = useState<BlinkSettings>(DEFAULT_BLINK_SETTINGS);

  const [live, setLive] = useState<LiveBuffer>(emptyLive);
  const [liveIndex, setLiveIndex] = useState(0);
  const [liveDetail, setLiveDetail] = useState("Not connected.");
  const [ports, setPorts] = useState<string[]>([]);
  const [port, setPort] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const blocked = hostedPageBlocksBridge();

  const playback = usePlayback(recording ? recording.samples[channel].length / recording.sfreq : 1);
  const fired = useRef(new Set<number>());
  const lastCursor = useRef(0);

  const detection = useMemo(() => {
    if (!recording) return { events: [] as CandidateEvent[], error: null as string | null };
    const samples = recording.samples[channel];
    if (!samples) return { events: [], error: "That channel is not in the file." };
    try {
      return { events: detectCandidateEvents(samples, recording.sfreq, settings), error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : "Could not scan that channel." };
    }
  }, [recording, channel, settings]);

  const liveView = useMemo(() => {
    const raw = live.channels[liveIndex];
    if (!raw || raw.length < 10) return { samples: [] as number[], events: [] as CandidateEvent[] };
    try {
      const filtered = bandpass(raw, live.sfreq, FILTER_LOW_HZ, filterHighHz(live.sfreq));
      const events = filtered.length >= live.sfreq * 0.2
        ? detectCandidateEvents(filtered, live.sfreq, settings)
        : [];
      return { samples: filtered, events };
    } catch {
      return { samples: raw, events: [] as CandidateEvent[] };
    }
  }, [live, liveIndex, settings]);

  function stopBeep() {
    if (audioRef.current) {
      void audioRef.current.close();
      audioRef.current = null;
    }
  }

  function beep() {
    const AudioCtx = window.AudioContext;
    if (!AudioCtx) return;
    if (!audioRef.current || audioRef.current.state === "closed") audioRef.current = new AudioCtx();
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 480;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  function choose(source: ScanSource) {
    if (source !== mode) return;
    const selection = activateSelection(elapsedRef.current, dwell, source);
    setLastChoice(selection.option);
    setLog((items) => [selection, ...items].slice(0, 12));
    beep();
  }
  chooseRef.current = choose;

  function changeMode(requested: InputMode) {
    const next = switchInputMode(mode, requested, accepted);
    setNotice(next.notice);
    if (!next.resetClock) return;
    stopBeep();
    fired.current.clear();
    lastCursor.current = 0;
    playback.restart();
    setClockKey((value) => value + 1);
    setMode(next.mode);
  }

  function resetBoard() {
    stopBeep();
    setLog([]);
    setLastChoice(null);
    fired.current.clear();
    lastCursor.current = 0;
    playback.restart();
    setClockKey((value) => value + 1);
  }

  useEffect(() => {
    fired.current.clear();
  }, [settings, channel, recording]);

  useEffect(() => {
    if (mode === "live") return;
    socketRef.current?.close();
    socketRef.current = null;
    setLive(emptyLive);
  }, [mode]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      if (audioRef.current) void audioRef.current.close();
    };
  }, []);

  useEffect(() => {
    const previous = lastCursor.current;
    const next = playback.cursor;
    lastCursor.current = next;
    if (mode !== "recorded" || !playback.playing || next < previous) return;
    for (const event of detection.events) {
      if (fired.current.has(event.peakIndex)) continue;
      if (event.timeS > previous && event.timeS <= next) {
        fired.current.add(event.peakIndex);
        chooseRef.current("recorded");
      }
    }
  }, [playback.cursor, playback.playing, mode, detection.events]);

  useEffect(() => {
    if (mode !== "live") return;
    const samples = live.channels[liveIndex] ?? [];
    for (const event of liveView.events) {
      const absolute = live.dropped + event.peakIndex;
      if (fired.current.has(absolute)) continue;
      if (samples.length === 0 || event.peakIndex < samples.length - live.sfreq * 0.3) continue;
      fired.current.add(absolute);
      chooseRef.current("live");
    }
  }, [liveView.events, live.dropped, live.sfreq, live.channels, liveIndex, mode]);

  function connectSocket() {
    if (blocked || mode !== "live") return;
    setLiveDetail("Opening the local bridge…");
    let socket: WebSocket;
    try {
      socket = new WebSocket(BRIDGE_URL);
    } catch {
      setLiveDetail("The browser refused the WebSocket. Use the local site, not a hosted https page.");
      return;
    }
    socketRef.current = socket;
    socket.onerror = () => {
      setLiveDetail("The bridge is not running. Stay on manual demo, or load a CSV for recorded mode.");
    };
    socket.onclose = () => {
      setLiveDetail("The bridge closed. No saved recording was substituted.");
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as BridgeMessage;
      if (message.type === "hello") {
        setLiveDetail(message.brainflow
          ? "Bridge is up. BrainFlow is installed. No board is open yet."
          : "Bridge is up, but BrainFlow is not installed.");
        socket.send(JSON.stringify({ op: "ports" }));
      } else if (message.type === "ports") {
        setPorts(message.ports);
        if (message.ports[0]) setPort(message.ports[0]);
      } else if (message.type === "status") {
        setLiveDetail(message.detail);
      } else if (message.type === "error") {
        setLiveDetail(message.message);
      } else if (message.type === "samples") {
        setLive((current) => appendLive(current, message.chunk, message.sfreq));
      }
    };
  }

  function dropRecordedMode() {
    setAccepted(false);
    if (mode !== "recorded") return;
    stopBeep();
    fired.current.clear();
    lastCursor.current = 0;
    playback.restart();
    setClockKey((value) => value + 1);
    setMode("manual");
    setNotice("Manual demo. Accept the marks on the new file before using recorded mode again.");
  }

  async function onFile(file: File) {
    setError(null);
    dropRecordedMode();
    setRecording(null);
    setTable(null);
    if (file.name.toLowerCase().endsWith(".json")) {
      try {
        const parsed = JSON.parse(await file.text()) as {
          format?: string;
          sfreq?: number;
          samples?: Record<string, number[]>;
          fileName?: string;
        };
        if (parsed.format !== "invisible-lab-eeg-session" || !parsed.samples || !parsed.sfreq) {
          setError("That JSON is not an Invisible Lab session file.");
          return;
        }
        const analysis = analyzeChannels(parsed.samples, parsed.sfreq);
        const channels = Object.keys(analysis.filtered);
        setRecording({
          fileName: parsed.fileName ?? file.name,
          sfreq: parsed.sfreq,
          channels,
          samples: analysis.filtered,
          warnings: analysis.warnings,
        });
        setChannel(channels.includes("Fp1") ? "Fp1" : channels[0]);
        setFileName(parsed.fileName ?? file.name);
      } catch {
        setError("Could not read that JSON file.");
      }
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Upload a CSV from the OpenBCI GUI, or a session JSON saved from the live page.");
      return;
    }
    try {
      const parsed = parseOpenBciCsv(await file.text());
      setTable(parsed);
      setFileName(file.name);
      setElectrodes(parsed.columns.map((column) => (column.kind === "eeg" ? column.electrode : "")));
      setSfreq(parsed.sampleRateFromHeader ?? parsed.sampleRateFromTime ?? 250);
      setUnit(parsed.unitsHint ?? "uV");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  function readTable() {
    if (!table) return;
    setError(null);
    try {
      const raw = samplesFromTable(table, electrodes, unit);
      const analysis = analyzeChannels(raw, sfreq);
      const channels = Object.keys(analysis.filtered);
      setRecording({
        fileName,
        sfreq,
        channels,
        samples: analysis.filtered,
        warnings: analysis.warnings,
      });
      setChannel(channels.includes("Fp1") ? "Fp1" : channels[0]);
      setTable(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that table.");
    }
  }

  const index = highlightIndex(elapsed, SCAN_OPTIONS.length, dwell);
  const channelNote = recording ? blinkChannelNote(channel) : blinkChannelNote(CYTON_MONTAGE[liveIndex] ?? "C3");
  const shownSamples = mode === "live" ? liveView.samples : recording?.samples[channel];
  const shownRate = mode === "live" ? live.sfreq : recording?.sfreq ?? 250;
  const shownEvents = mode === "live" ? liveView.events : detection.events;
  const traceLabel = mode === "live"
    ? `Live · channel ${liveIndex + 1} · candidate marks`
    : recording
      ? `${channel} · candidate marks · not confirmed blinks`
      : "";

  return (
    <div className="page">
      <p className="kicker kicker-eeg">Science in Action</p>
      <h1>Can a noisy signal press a button?</h1>
      <p className="lede">
        Some people use one switch to pick a word on a screen. The words light up in order, and the switch chooses the lit word. Try that yourself first. A blink can be the switch, but this page does not include a recording where blinks were labeled, and it is not a medical device.
      </p>
      <HowTo
        steps={[
          "Watch Water, Help, Yes, and No light up one at a time.",
          "When the word you want is lit, press Select, click that word, or press Space.",
          "Read the log. In manual mode, you made the choice. A brain signal did not.",
          "Recorded EEG stays off until you load your own file and accept the marks.",
        ]}
      />
      <p>
        Active mode: <strong>{modeLabel(mode)}</strong>
        {mode === "live" && !LIVE_BRIDGE_TESTED ? " · not tested with a Cyton" : ""}
      </p>
      {notice ? <p className="result-note">{notice}</p> : null}

      <div className="choice-row" role="group" aria-label="Input mode">
        <button type="button" className={mode === "manual" ? "btn selected" : "btn"} onClick={() => changeMode("manual")}>
          Manual demo
        </button>
        <button type="button" className={mode === "recorded" ? "btn selected" : "btn"} onClick={() => changeMode("recorded")} disabled={!accepted && mode !== "recorded"}>
          Recorded EEG
        </button>
        <button type="button" className={mode === "live" ? "btn selected" : "btn"} onClick={() => changeMode("live")}>
          Live OpenBCI
        </button>
      </div>
      {!accepted ? (
        <p className="quiet">Recorded EEG is off. No verified blink recording ships with the site. Load a file below and accept the marks if you want that mode.</p>
      ) : null}

      <label>
        Highlight each choice for {dwell} ms
        <input
          type="range"
          min={800}
          max={2500}
          step={100}
          value={dwell}
          onChange={(event) => setDwell(Number(event.target.value))}
        />
      </label>

      <ScanBoard
        labels={SCAN_OPTIONS}
        index={index}
        lastChoice={lastChoice}
        selectEnabled={mode === "manual"}
        onSelect={() => choose("manual")}
      />
      <p className="quiet">
        {mode === "manual"
          ? "Click the highlighted choice, press the button, or focus the board and press Space."
          : "Select is disabled in this mode so a mouse click is not mistaken for a signal. Change back to Manual demo if you want the button."}
      </p>

      <div className="choice-row">
        <button type="button" className="btn" onClick={resetBoard}>Reset</button>
        {recording && mode === "recorded" ? (
          <button type="button" className="btn" onClick={() => {
            fired.current.clear();
            lastCursor.current = 0;
            playback.restart();
            playback.setPlaying(true);
          }}>
            Replay recording
          </button>
        ) : null}
      </div>

      <h2>Event log</h2>
      {log.length === 0 ? <p className="quiet">No selection yet.</p> : (
        <ul className="log-list">
          {log.map((item, itemIndex) => (
            <li key={`${item.elapsedMs}-${itemIndex}`}>
              {item.option} · {modeLabel(item.source)} · {Math.round(item.elapsedMs / 100) / 10} s into the scan
            </li>
          ))}
        </ul>
      )}

      <details className="science-details" open={mode !== "manual"}>
      <summary>Have a recording? Explore signal detection and advanced controls</summary>
      <h2>Signal and threshold</h2>
      <p>
        The detector subtracts the median, smooths about 40 ms, and keeps a bump that stays past the threshold for {settings.minDurationMs}–{settings.maxDurationMs} ms. It then waits {settings.refractoryMs} ms. A spike is not assumed to be a blink.
      </p>
      <div className="choice-row">
        <label>
          Threshold (µV)
          <input type="number" min={10} max={500} value={settings.thresholdUv} onChange={(event) => setSettings({ ...settings, thresholdUv: Number(event.target.value) })} />
        </label>
        <label>
          Min duration (ms)
          <input type="number" min={20} max={300} value={settings.minDurationMs} onChange={(event) => setSettings({ ...settings, minDurationMs: Number(event.target.value) })} />
        </label>
        <label>
          Max duration (ms)
          <input type="number" min={100} max={1000} value={settings.maxDurationMs} onChange={(event) => setSettings({ ...settings, maxDurationMs: Number(event.target.value) })} />
        </label>
        <label>
          Refractory (ms)
          <input type="number" min={0} max={2000} value={settings.refractoryMs} onChange={(event) => setSettings({ ...settings, refractoryMs: Number(event.target.value) })} />
        </label>
      </div>
      {channelNote ? <p className="result-note">{channelNote}</p> : null}

      {mode === "live" ? (
        <section>
          <Badge origin="live" text={live.channels[0]?.length ? "Live · incoming samples · not a saved file" : "Live page · no samples yet"} />
          <p className="result-note">{liveDetail}</p>
          {blocked ? (
            <p>This page was opened over https, so the browser will not call ws://127.0.0.1. Use manual demo, or run the local site.</p>
          ) : (
            <div className="choice-row">
              <button type="button" className="btn" onClick={connectSocket}>Connect Live OpenBCI</button>
              <label>
                Serial port
                <select value={port} onChange={(event) => setPort(event.target.value)}>
                  <option value="">Choose</option>
                  {ports.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <button type="button" className="btn" disabled={!port} onClick={() => socketRef.current?.send(JSON.stringify({ op: "connect", port }))}>Open board</button>
              <button type="button" className="btn" onClick={() => socketRef.current?.send(JSON.stringify({ op: "start" }))}>Stream</button>
              <button type="button" className="btn" onClick={() => socketRef.current?.send(JSON.stringify({ op: "stop" }))}>Stop</button>
            </div>
          )}
          <label>
            Channel index
            <select value={liveIndex} onChange={(event) => setLiveIndex(Number(event.target.value))}>
              {CYTON_MONTAGE.map((name, itemIndex) => (
                <option key={name} value={itemIndex}>{itemIndex} · {name} if your GUI uses that order</option>
              ))}
            </select>
          </label>
          <p className="quiet">{liveView.events.length} candidate mark{liveView.events.length === 1 ? "" : "s"} in the latest window.</p>
          {liveDetail && mode === "live" ? (
            <p>
              If the headset is unavailable, switch to <button type="button" className="btn" onClick={() => changeMode("manual")}>Manual demo</button>
              {accepted ? <button type="button" className="btn" onClick={() => changeMode("recorded")}>Recorded EEG</button> : " or load a file for recorded mode."}
            </p>
          ) : null}
        </section>
      ) : (
        <section>
          <label className="file-button">
            Choose a CSV or a saved session
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
          </label>
          {error ? <p className="result-note">{error}</p> : null}
          {table ? (
            <>
              <p className="quiet">Confirm the columns before the detector runs. Header rate: {table.sampleRateFromHeader ?? "not found"}.</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Column</th><th>Electrode</th></tr>
                  </thead>
                  <tbody>
                    {table.columns.map((column, columnIndex) => (
                      <tr key={column.header}>
                        <td>{column.header}</td>
                        <td>
                          <select
                            value={electrodes[columnIndex] ?? ""}
                            onChange={(event) => {
                              const next = electrodes.slice();
                              next[columnIndex] = event.target.value;
                              setElectrodes(next);
                            }}
                          >
                            {ELECTRODE_OPTIONS.map((option) => (
                              <option key={option || "skip"} value={option}>{option || "Ignore"}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="choice-row">
                <label>
                  Sampling rate (Hz)
                  <input type="number" min={100} max={2000} value={sfreq} onChange={(event) => setSfreq(Number(event.target.value))} />
                </label>
                <label>
                  <input type="radio" name="blink-units" checked={unit === "uV"} onChange={() => setUnit("uV")} /> Microvolts
                </label>
                <label>
                  <input type="radio" name="blink-units" checked={unit === "counts"} onChange={() => setUnit("counts")} /> Cyton raw counts
                </label>
                <button type="button" className="btn primary" onClick={readTable}>Read this file</button>
              </div>
            </>
          ) : null}
          {recording ? (
            <>
              <Badge origin="upload" text={`Uploaded file · ${recording.fileName} · not a PhysioNet baseline · not live`} />
              {recording.warnings.map((warning) => <p key={warning} className="quiet">{warning}</p>)}
              <div className="choice-row">
                {recording.channels.map((name) => (
                  <button key={name} type="button" className={channel === name ? "btn selected" : "btn"} onClick={() => setChannel(name)}>
                    {name}
                  </button>
                ))}
              </div>
              <p className="quiet">{detection.error ? detection.error : `${detection.events.length} candidate mark${detection.events.length === 1 ? "" : "s"} on ${channel}.`}</p>
              <button
                type="button"
                className="btn primary"
                disabled={Boolean(detection.error)}
                onClick={() => {
                  setAccepted(true);
                  setNotice("Marks accepted. Recorded EEG can now be selected. The marks are still candidates, not confirmed blinks.");
                }}
              >
                {accepted ? "Marks accepted" : "Accept marks and allow recorded mode"}
              </button>
            </>
          ) : (
            <p>No file is loaded. Manual demo does not need one. The <Link to="/brain/artifacts">artifacts lesson</Link> explains why PhysioNet baselines are not marked as blinks.</p>
          )}
        </section>
      )}

      {shownSamples && shownSamples.length > 10 ? (
        <>
          <Waveform
            samples={shownSamples}
            sfreq={shownRate}
            cursorS={mode === "live" ? Math.max(0, shownSamples.length / shownRate - 4) : playback.cursor}
            windowS={4}
            unit="µV"
            color="#2aa7b8"
            label={traceLabel}
            peaks={shownEvents.map((event) => event.peakIndex)}
          />
          {mode !== "live" && recording ? (
            <Playback
              durationS={shownSamples.length / shownRate}
              cursor={playback.cursor}
              playing={playback.playing}
              speed={playback.speed}
              onCursor={playback.setCursor}
              onPlaying={playback.setPlaying}
              onSpeed={playback.setSpeed}
              onRestart={() => {
                fired.current.clear();
                lastCursor.current = 0;
                playback.restart();
              }}
            />
          ) : null}
          {mode === "recorded" ? <p className="quiet">Play the recording. Each new candidate mark selects whatever choice is highlighted.</p> : null}
        </>
      ) : null}

      </details>
      <h2>When noise becomes technology</h2>
      <p>How can a signal that scientists usually remove as noise become useful for controlling a computer?</p>
      <h3>Predict</h3>
      <Prediction
        lessonId="blink-noise"
        prompt="Eye blinks in an EEG recording are normally treated as:"
        options={[
          { id: "useful", label: "The brain activity the experiment wants" },
          { id: "artifact", label: "Artifacts" },
          { id: "heart", label: "A heart signal" },
        ]}
      />
      <h3>Explore</h3>
      <p>
        Neural rhythms, such as alpha, are the electrical activity of the brain at the scalp. An eye blink moves the eyeball and the eyelid. That movement creates a large, slow voltage. Researchers often remove it before they study the brain. This site does not include a recording in which those blinks were labeled by a person. Do not treat a PhysioNet baseline as a blink file.
      </p>
      <h3>Detect</h3>
      <p>
        If you load a file, the dashed lines are places where one channel crossed your threshold for a short time. Lower the threshold and you will see more marks, including ones that are not blinks. Raise it and you may see none. That tradeoff is the calibration.
      </p>
      <h3>Apply</h3>
      <p>
        In recorded mode, those marks press the highlighted choice. In manual mode, you are the switch. The four words are a classroom stand-in for a communication board.
      </p>
      <h3>Explain</h3>
      <p>
        Assistive scanning is a real interface pattern: choices light up in order, and one switch picks the lit choice. The switch can be a button, a muscle twitch, or a large eye-movement artifact. The processing steps are filter, threshold, and a waiting period so one blink does not count twice.
      </p>
      <h3>Reflect</h3>
      <Quiz
        lessonId="blink-limit"
        prompt="What is a real limit of this detector on the usual Cyton layout?"
        options={[
          { id: "front", label: "Those electrodes are not the frontal sites where blinks are largest, so it can miss blinks and also mark other noise" },
          { id: "perfect", label: "It identifies blinks with certainty on any channel" },
        ]}
        answer="front"
        explanation="C3 through O2 are a motor-imagery layout. A threshold on one of them is a candidate finder, not a verified blink label."
      />

      <LearnMore topic="action" />
      <h2>Later ideas</h2>
      <p className="quiet">Only Blink-to-Select is built. The rest are names.</p>
      <ul className="soon-list">
        {actionApps.filter((app) => app.status === "soon").map((app) => (
          <li key={app.id}>{app.name}. {app.later}</li>
        ))}
      </ul>
    </div>
  );
}

function modeLabel(mode: InputMode): string {
  if (mode === "manual") return "Manual demo";
  if (mode === "recorded") return "Recorded EEG";
  return "Live OpenBCI";
}

function appendLive(current: LiveBuffer, chunk: number[][], sfreq: number): LiveBuffer {
  const width = Math.max(current.channels.length, chunk[0]?.length ?? 0, 1);
  const channels = Array.from({ length: width }, (_, index) => (current.channels[index] ? current.channels[index].slice() : []));
  for (const row of chunk) {
    for (let index = 0; index < row.length; index++) {
      if (!channels[index]) channels[index] = [];
      channels[index].push(row[index]);
    }
  }
  const cap = Math.round(sfreq * 20);
  const overflow = Math.max(0, (channels[0]?.length ?? 0) - cap);
  if (overflow > 0) {
    for (let index = 0; index < channels.length; index++) {
      channels[index] = channels[index].slice(overflow);
    }
  }
  return { channels, dropped: current.dropped + overflow, sfreq };
}
