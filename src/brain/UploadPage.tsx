import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { BandList } from "../components/BandList";
import { Playback, usePlayback } from "../components/Playback";
import { Waveform } from "../components/Waveform";
import { CYTON_MONTAGE, parseOpenBciCsv, samplesFromTable, type ParsedTable, type UnitsChoice } from "../openbci/parseCsv";
import { alphaBetween, analyzeChannels } from "../signal/analyze";
import { direction } from "../signal/bpm";
import { formatPower } from "../signal/format";
import type { BandName } from "../signal/bands";
import { useSession } from "./session";

const ELECTRODE_OPTIONS = ["", ...CYTON_MONTAGE, "Fp1", "Fp2", "F3", "F4", "Fz"];

export function UploadPage() {
  const { setRecording } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [fileName, setFileName] = useState("");
  const [electrodes, setElectrodes] = useState<string[]>([]);
  const [sfreq, setSfreq] = useState(250);
  const [unit, setUnit] = useState<UnitsChoice>("uV");
  const [analyzed, setAnalyzed] = useState<ReturnType<typeof analyzeChannels> & { samples: Record<string, number[]>; channels: string[] } | null>(null);
  const [channel, setChannel] = useState("O1");
  const [openRange, setOpenRange] = useState({ start: 0, end: 30 });
  const [closedRange, setClosedRange] = useState({ start: 30, end: 60 });
  const playback = usePlayback(analyzed ? analyzed.samples[analyzed.channels[0]].length / sfreq : 1);

  const shownChannel = analyzed && analyzed.samples[channel] ? channel : analyzed?.channels[0] ?? "O1";

  const comparison = useMemo(() => {
    if (!analyzed) return null;
    const posterior = ["O1", "O2"].filter((name) => analyzed.samples[name]);
    if (posterior.length === 0) return { missing: true as const };
    const values = (range: { start: number; end: number }) => {
      const found = posterior
        .map((name) => alphaBetween(analyzed.samples[name], sfreq, range.start, range.end))
        .filter((value): value is number => value !== null);
      if (found.length === 0) return null;
      return found.reduce((sum, value) => sum + value, 0) / found.length;
    };
    const open = values(openRange);
    const closed = values(closedRange);
    return { missing: false as const, open, closed };
  }, [analyzed, sfreq, openRange, closedRange]);

  async function onFile(file: File) {
    setError(null);
    setAnalyzed(null);
    setTable(null);
    if (file.name.toLowerCase().endsWith(".json")) {
      try {
        const parsed = JSON.parse(await file.text()) as {
          format?: string;
          sfreq?: number;
          samples?: Record<string, number[]>;
          fileName?: string;
          origin?: "upload" | "live";
        };
        if (parsed.format !== "invisible-lab-eeg-session" || !parsed.samples || !parsed.sfreq) {
          setError("That JSON is not an Invisible Lab session file.");
          return;
        }
        const analysis = analyzeChannels(parsed.samples, parsed.sfreq);
        const channels = Object.keys(parsed.samples);
        setSfreq(parsed.sfreq);
        setAnalyzed({ ...analysis, samples: analysis.filtered, channels });
        setChannel(channels.includes("O1") ? "O1" : channels[0]);
        setFileName(parsed.fileName ?? file.name);
        setRecording({
          origin: parsed.origin === "live" ? "live" : "upload",
          fileName: parsed.fileName ?? file.name,
          sfreq: parsed.sfreq,
          unit: "uV",
          channels,
          samples: analysis.filtered,
          durationS: analysis.filtered[channels[0]].length / parsed.sfreq,
          bands: analysis.bands,
          timeline: analysis.timeline,
          warnings: analysis.warnings,
        });
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
      const text = await file.text();
      const parsed = parseOpenBciCsv(text);
      setTable(parsed);
      setFileName(file.name);
      setElectrodes(parsed.columns.map((column) => (column.kind === "eeg" ? column.electrode : "")));
      setSfreq(parsed.sampleRateFromHeader ?? parsed.sampleRateFromTime ?? 250);
      setUnit(parsed.unitsHint ?? "uV");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  function analyze() {
    if (!table) return;
    setError(null);
    try {
      if (!(sfreq >= 100 && sfreq <= 2000)) throw new Error("Sampling rate should be between 100 and 2000 Hz.");
      const raw = samplesFromTable(table, electrodes, unit);
      const analysis = analyzeChannels(raw, sfreq);
      const channels = Object.keys(raw);
      setAnalyzed({ ...analysis, samples: analysis.filtered, channels });
      setChannel(channels.includes("O1") ? "O1" : channels[0]);
      const durationS = analysis.filtered[channels[0]].length / sfreq;
      setRecording({
        origin: "upload",
        fileName,
        sfreq,
        unit: "uV",
        channels,
        samples: analysis.filtered,
        durationS,
        bands: analysis.bands,
        timeline: analysis.timeline,
        warnings: analysis.warnings,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze that file.");
    }
  }

  return (
    <article>
      <h1>Upload a recording</h1>
      <p className="lede">
        Do the eyes lesson before this page. When you have your own headset, record in the OpenBCI desktop app, export a CSV, and open it here. The usual electrode order is {CYTON_MONTAGE.join(", ")}. You confirm the columns. The app will not guess them for you.
      </p>
      <ol className="steps">
        <li>In the OpenBCI GUI, check impedances and start a session on the Cyton.</li>
        <li>Sit still. Record about 30 seconds with eyes open, then 30 seconds with eyes closed.</li>
        <li>Export the CSV. Upload it below, confirm microvolts, then mark the two time ranges.</li>
      </ol>
      <p className="quiet">
        A live view is on the <Link to="/brain/live">Live board</Link> page. It needs the local bridge and has not been tested with a headset in this project.
      </p>
      <label className="file-button">
        Choose CSV or saved session JSON
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
        <section>
          <h2>Columns in {fileName}</h2>
          {table.warnings.map((warning) => (
            <p key={warning} className="result-note">{warning}</p>
          ))}
          <p className="quiet">
            Header sample rate: {table.sampleRateFromHeader ?? "not found"}. Time-column estimate: {table.sampleRateFromTime ?? "not used"}.
            Units hint: {table.unitsHint ?? "none"}.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Column</th>
                  <th>First value</th>
                  <th>Electrode</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((column, index) => (
                  <tr key={column.header}>
                    <td>{column.header}</td>
                    <td>{table.rows[0][column.index]}</td>
                    <td>
                      <select
                        value={electrodes[index] ?? ""}
                        onChange={(event) => {
                          const next = electrodes.slice();
                          next[index] = event.target.value;
                          setElectrodes(next);
                        }}
                      >
                        {ELECTRODE_OPTIONS.map((option) => (
                          <option key={option || "skip"} value={option}>
                            {option || "Ignore"}
                          </option>
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
              <input type="radio" name="units" checked={unit === "uV"} onChange={() => setUnit("uV")} /> Microvolts
            </label>
            <label>
              <input type="radio" name="units" checked={unit === "counts"} onChange={() => setUnit("counts")} /> Cyton raw counts
            </label>
            <button type="button" className="btn primary" onClick={analyze}>
              Analyze
            </button>
          </div>
        </section>
      ) : null}
      {analyzed ? (
        <section>
          <Badge origin="upload" text={`Uploaded file · ${fileName} · ${sfreq} Hz · microvolts after conversion`} />
          {analyzed.warnings.map((warning) => (
            <p key={warning} className="quiet">{warning}</p>
          ))}
          <div className="choice-row">
            {analyzed.channels.map((name) => (
              <button key={name} type="button" className={shownChannel === name ? "btn selected" : "btn"} onClick={() => setChannel(name)}>
                {name}
              </button>
            ))}
          </div>
          <Waveform
            samples={analyzed.samples[shownChannel]}
            sfreq={sfreq}
            cursorS={playback.cursor}
            windowS={4}
            unit="µV"
            color="#2aa7b8"
            label={`${shownChannel} · filtered upload`}
          />
          <Playback
            durationS={analyzed.samples[shownChannel].length / sfreq}
            cursor={playback.cursor}
            playing={playback.playing}
            speed={playback.speed}
            onCursor={playback.setCursor}
            onPlaying={playback.setPlaying}
            onSpeed={playback.setSpeed}
            onRestart={playback.restart}
          />
          <BandList
            absolute={analyzed.bands[shownChannel].absoluteUv2}
            relative={analyzed.bands[shownChannel].relative}
            highlight={"alpha" as BandName}
          />
          <h2>Eyes open and eyes closed in this file</h2>
          <p>If you recorded both in one sitting, set the two stretches in seconds. Each stretch needs at least 4 seconds. This is your file, not a PhysioNet baseline.</p>
          <div className="choice-row">
            <label>
              Open start
              <input type="number" value={openRange.start} onChange={(event) => setOpenRange({ ...openRange, start: Number(event.target.value) })} />
            </label>
            <label>
              Open end
              <input type="number" value={openRange.end} onChange={(event) => setOpenRange({ ...openRange, end: Number(event.target.value) })} />
            </label>
            <label>
              Closed start
              <input type="number" value={closedRange.start} onChange={(event) => setClosedRange({ ...closedRange, start: Number(event.target.value) })} />
            </label>
            <label>
              Closed end
              <input type="number" value={closedRange.end} onChange={(event) => setClosedRange({ ...closedRange, end: Number(event.target.value) })} />
            </label>
          </div>
          {comparison?.missing ? <p>O1 or O2 was not in the mapped columns, so posterior alpha cannot be compared.</p> : null}
          {comparison && !comparison.missing ? (
            <p>
              {comparison.open === null || comparison.closed === null
                ? "One of those ranges is shorter than 4 seconds, or it falls outside the file."
                : `Posterior alpha: eyes open ${formatPower(comparison.open)} µV², eyes closed ${formatPower(comparison.closed)} µV². Direction: ${direction(comparison.open, comparison.closed)}.`}
            </p>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
