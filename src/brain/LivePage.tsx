import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { BandList } from "../components/BandList";
import { Waveform } from "../components/Waveform";
import { BRIDGE_URL, hostedPageBlocksBridge, LIVE_BRIDGE_TESTED, type BridgeMessage } from "../openbci/liveClient";
import { CYTON_MONTAGE } from "../openbci/parseCsv";
import { analyzeChannels } from "../signal/analyze";
import { useSession } from "./session";

type Status = "idle" | "socket" | "ready" | "streaming" | "error";

export function LivePage() {
  const { setRecording } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState("Not connected.");
  const [ports, setPorts] = useState<string[]>([]);
  const [port, setPort] = useState("");
  const [sfreq, setSfreq] = useState(250);
  const [samples, setSamples] = useState<number[][]>(CYTON_MONTAGE.map(() => []));
  const socketRef = useRef<WebSocket | null>(null);
  const blocked = hostedPageBlocksBridge();

  useEffect(() => {
    return () => socketRef.current?.close();
  }, []);

  function send(payload: object) {
    socketRef.current?.send(JSON.stringify(payload));
  }

  function connectSocket() {
    if (blocked) return;
    setStatus("socket");
    setDetail("Opening the local bridge…");
    let socket: WebSocket;
    try {
      socket = new WebSocket(BRIDGE_URL);
    } catch {
      setStatus("error");
      setDetail("The browser refused the WebSocket. Use the local site, not a hosted https page.");
      return;
    }
    socketRef.current = socket;
    socket.onerror = () => {
      setStatus("error");
      setDetail("The bridge is not running, or the browser blocked it. Start it from the OpenBCI guide, or use PhysioNet / an uploaded CSV.");
    };
    socket.onclose = () => {
      setStatus((current) => (current === "streaming" || current === "ready" ? "error" : current));
      setDetail((current) => (socketRef.current ? "The bridge closed the connection. Samples already received are still on this page." : current));
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as BridgeMessage;
      if (message.type === "hello") {
        setStatus("ready");
        setDetail(message.brainflow ? "Bridge is up. BrainFlow is installed. No board is open yet." : "Bridge is up, but BrainFlow is not installed in that Python environment.");
        send({ op: "ports" });
      } else if (message.type === "ports") {
        setPorts(message.ports);
        if (message.ports[0]) setPort(message.ports[0]);
      } else if (message.type === "status") {
        setDetail(message.detail);
        if (message.state === "streaming") setStatus("streaming");
        if (message.state === "connected") setStatus("ready");
        if (message.state === "error") setStatus("error");
      } else if (message.type === "error") {
        setStatus("error");
        setDetail(message.message);
      } else if (message.type === "samples") {
        setSfreq(message.sfreq);
        setSamples((current) => {
          const next = current.map((channel) => channel.slice());
          for (const row of message.chunk) {
            row.forEach((value, index) => {
              if (!next[index]) next[index] = [];
              next[index].push(value);
            });
          }
          return next;
        });
      }
    };
  }

  const length = samples[0]?.length ?? 0;
  const durationS = length / sfreq;
  const recentStart = Math.max(0, length - Math.round(4 * sfreq));
  const view = samples[0]?.slice(recentStart) ?? [];
  const samplesRef = useRef(samples);
  samplesRef.current = samples;
  const second = Math.floor(length / sfreq);
  const rolling = useMemo(() => {
    if (second < 8) return null;
    const take = Math.round(8 * sfreq);
    const current = samplesRef.current;
    return analyzeChannels(
      { O1: (current[6] ?? []).slice(-take), O2: (current[7] ?? []).slice(-take) },
      sfreq,
    );
  }, [second, sfreq]);

  function save() {
    const named: Record<string, number[]> = {};
    CYTON_MONTAGE.forEach((name, index) => {
      named[name] = samples[index] ?? [];
    });
    const payload = {
      format: "invisible-lab-eeg-session",
      version: 1,
      origin: "live",
      fileName: `cyton-${new Date().toISOString().slice(0, 19)}.json`,
      sfreq,
      unit: "uV",
      channels: CYTON_MONTAGE,
      samples: named,
    };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = payload.fileName;
    link.click();
    URL.revokeObjectURL(url);
    if (length > sfreq) {
      const analysis = analyzeChannels(named, sfreq);
      setRecording({
        origin: "live",
        fileName: payload.fileName,
        sfreq,
        unit: "uV",
        channels: CYTON_MONTAGE,
        samples: analysis.filtered,
        durationS: length / sfreq,
        bands: analysis.bands,
        timeline: analysis.timeline,
        warnings: analysis.warnings,
      });
    }
  }

  return (
    <article>
      <h1>Live Cyton board</h1>
      <p className="lede">
        This page talks only to a bridge on this computer. {LIVE_BRIDGE_TESTED ? "" : "Live capture has not been tested with a Cyton board in this version of the project."}
      </p>
      <Badge origin="live" text={status === "streaming" ? "Live · Cyton · incoming samples" : "Live page · no prerecorded signal is shown here"} />
      <p className="result-note">{detail}</p>
      {blocked ? (
        <p>
          This page was opened over https, so the browser will not call ws://127.0.0.1. Run <code>npm run dev</code> and open the local address. The hosted site can still use{" "}
          <Link to="/brain/eyes">PhysioNet</Link> or an <Link to="/brain/upload">uploaded CSV</Link>.
        </p>
      ) : (
        <div className="choice-row">
          <button type="button" className="btn primary" onClick={connectSocket} disabled={status === "socket" || status === "streaming"}>
            Connect Live OpenBCI
          </button>
          <label>
            Serial port
            <select value={port} onChange={(event) => setPort(event.target.value)}>
              <option value="">Choose</option>
              {ports.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" disabled={!port || status === "idle"} onClick={() => send({ op: "connect", port })}>
            Open board
          </button>
          <button type="button" className="btn" onClick={() => send({ op: "start" })}>
            Stream
          </button>
          <button type="button" className="btn" onClick={() => send({ op: "stop" })}>
            Stop
          </button>
          <button type="button" className="btn" onClick={() => send({ op: "disconnect" })}>
            Disconnect
          </button>
        </div>
      )}
      <p className="quiet">
        Sampling rate reported by the bridge: {sfreq} Hz. Samples kept: {length}. Electrode names are the headset layout ({CYTON_MONTAGE.join(", ")}). The board does not detect those names.
      </p>
      {length > 10 ? (
        <>
          <Waveform samples={view} sfreq={sfreq} cursorS={0} windowS={Math.min(4, durationS)} unit="µV" color="#2aa7b8" label="Channel 1, labeled C3 if your GUI uses that order" />
          {rolling ? <BandList absolute={rolling.bands.O1.absoluteUv2} relative={rolling.bands.O1.relative} highlight="alpha" /> : <p className="quiet">Band power appears after about 8 seconds of samples.</p>}
          <button type="button" className="btn" onClick={save}>
            Save this capture
          </button>
        </>
      ) : (
        <p>No live samples yet. A failed connection leaves this page empty on purpose.</p>
      )}
      <p>
        If the headset is unavailable, use <Link to="/brain/eyes">Explore PhysioNet</Link> or <Link to="/brain/upload">upload a CSV</Link>. Quiz progress is kept either way.
      </p>
    </article>
  );
}
