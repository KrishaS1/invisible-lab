// OpenBCI GUI exports and BrainFlow-style tables do not share a column order.
// The importer keeps the guess visible and lets the student confirm it.

export const CYTON_UV_PER_COUNT = (4.5 / 24 / (2 ** 23 - 1)) * 1e6;

export const CYTON_MONTAGE = ["C3", "Cz", "C4", "P3", "Pz", "P4", "O1", "O2"];

const KNOWN_ELECTRODES = new Set([
  "FP1", "FP2", "FPZ", "FZ", "F3", "F4", "F7", "F8",
  "CZ", "C3", "C4", "C1", "C2",
  "PZ", "P3", "P4", "P7", "P8",
  "O1", "O2", "OZ",
  "T7", "T8", "T3", "T4",
]);

export type UnitsChoice = "uV" | "counts";

export type ColumnGuess = {
  header: string;
  index: number;
  electrode: string;
  kind: "eeg" | "time" | "marker" | "skip";
};

export type ParsedTable = {
  comments: string[];
  sampleRateFromHeader: number | null;
  sampleRateFromTime: number | null;
  unitsHint: UnitsChoice | null;
  columns: ColumnGuess[];
  rows: number[][];
  warnings: string[];
};

export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function electrodeFromHeader(header: string): string | null {
  const cleaned = header.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
  if (KNOWN_ELECTRODES.has(cleaned)) {
    if (cleaned === "T3") return "T7";
    if (cleaned === "T4") return "T8";
    return cleaned === "CZ" ? "Cz" : cleaned === "FZ" ? "Fz" : cleaned === "PZ" ? "Pz" : cleaned === "OZ" ? "Oz" : cleaned.charAt(0) + cleaned.slice(1).toLowerCase();
  }
  // FP1 -> Fp1, O1 stays O1. The line above lowercases the tail, so O1 becomes O1. Good.
  const exg = header.match(/exg\s*channel\s*(\d+)/i);
  if (exg) {
    const index = Number(exg[1]);
    return CYTON_MONTAGE[index] ?? null;
  }
  return null;
}

function prettyElectrode(name: string): string {
  const upper = name.toUpperCase();
  if (upper === "CZ") return "Cz";
  if (upper === "FZ") return "Fz";
  if (upper === "PZ") return "Pz";
  if (upper === "OZ") return "Oz";
  if (upper.startsWith("FP")) return "Fp" + upper.slice(2);
  return upper;
}

function kindFor(header: string, electrode: string | null): ColumnGuess["kind"] {
  if (electrode) return "eeg";
  const text = header.toLowerCase();
  if (text.includes("timestamp") || text === "time" || text.includes("time (formatted)")) {
    if (text.includes("formatted")) return "skip";
    return "time";
  }
  if (text.includes("marker")) return "marker";
  return "skip";
}

export function parseOpenBciCsv(text: string): ParsedTable {
  if (text.length > 20_000_000) {
    throw new Error("That file is over 20 MB. Export a shorter recording and try again.");
  }
  const comments: string[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  const body: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith("%") || line.trim().startsWith("#")) comments.push(line.trim());
    else body.push(line);
  }
  if (body.length < 2) {
    throw new Error("The file needs a header row and at least one sample row.");
  }
  const headers = splitCsvLine(body[0]);
  if (!headers.some((header) => /[A-Za-z]/.test(header))) {
    throw new Error("The first row does not look like column names. This importer expects a header.");
  }
  const rows: number[][] = [];
  for (let i = 1; i < body.length; i++) {
    const cells = splitCsvLine(body[i]);
    if (cells.length === 1 && cells[0] === "") continue;
    if (cells.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${cells.length} columns, but the header has ${headers.length}.`);
    }
    const numbers = cells.map((cell) => (cell === "" ? NaN : Number(cell)));
    if (numbers.some((value) => !Number.isFinite(value))) {
      throw new Error(`Row ${i + 1} has a value that is not a number.`);
    }
    rows.push(numbers);
  }
  if (rows.length < 8) throw new Error("The file has too few samples to plot.");

  const commentText = comments.join(" ").toLowerCase();
  let sampleRateFromHeader: number | null = null;
  const rateMatch = commentText.match(/sample rate\s*=\s*([\d.]+)/);
  if (rateMatch) sampleRateFromHeader = Number(rateMatch[1]);
  let unitsHint: UnitsChoice | null = null;
  if (commentText.includes("microvolt") || commentText.includes("µv") || commentText.includes("uv")) unitsHint = "uV";

  const columns: ColumnGuess[] = headers.map((header, index) => {
    const rawElectrode = electrodeFromHeader(header);
    const electrode = rawElectrode ? prettyElectrode(rawElectrode) : "";
    return { header, index, electrode, kind: kindFor(header, rawElectrode) };
  });

  const timeColumn = columns.find((column) => column.kind === "time");
  let sampleRateFromTime: number | null = null;
  const warnings: string[] = [];
  if (timeColumn) {
    const deltas: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      const dt = rows[i][timeColumn.index] - rows[i - 1][timeColumn.index];
      if (dt > 0) deltas.push(dt);
    }
    deltas.sort((a, b) => a - b);
    const median = deltas[Math.floor(deltas.length / 2)] ?? 0;
    let seconds = median;
    if (median > 0.5 && median < 50) seconds = median / 1000;
    const rate = seconds > 0 ? 1 / seconds : 0;
    if (rate >= 100 && rate <= 2000) sampleRateFromTime = Math.round(rate);
    else if (median > 0) {
      warnings.push("The time column does not look like a steady sample clock, so it was not used for the sampling rate.");
    }
  }

  if (!columns.some((column) => column.kind === "eeg")) {
    warnings.push("No electrode names were recognized. Map the EEG columns before analyzing.");
  }
  return { comments, sampleRateFromHeader, sampleRateFromTime, unitsHint, columns, rows, warnings };
}

export function samplesFromTable(
  table: ParsedTable,
  electrodes: string[],
  unit: UnitsChoice,
): Record<string, number[]> {
  const used = new Map<string, number>();
  table.columns.forEach((column, index) => {
    const name = electrodes[index]?.trim();
    if (!name) return;
    if (used.has(name)) {
      throw new Error(`${name} is selected on more than one column.`);
    }
    used.set(name, column.index);
  });
  if (used.size === 0) throw new Error("Choose at least one electrode column.");
  const scale = unit === "counts" ? CYTON_UV_PER_COUNT : 1;
  const samples: Record<string, number[]> = {};
  for (const [name, index] of used) {
    samples[name] = table.rows.map((row) => row[index] * scale);
  }
  return samples;
}
