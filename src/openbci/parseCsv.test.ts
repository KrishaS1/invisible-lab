import { describe, expect, it } from "vitest";
import { CYTON_UV_PER_COUNT, parseOpenBciCsv, samplesFromTable } from "./parseCsv";

const gui = `%OpenBCI Raw EEG Data
%Sample Rate = 250 Hz
%Other Columns = EEG data in microvolts
Sample Index, EXG Channel 0, EXG Channel 1, Accel Channel 0, Timestamp, Marker Channel
0, 10, 11, 0, 100.000, 0
1, 12, 13, 0, 100.004, 0
2, 14, 15, 0, 100.008, 0
3, 16, 17, 0, 100.012, 0
4, 18, 19, 0, 100.016, 0
5, 20, 21, 0, 100.020, 0
6, 22, 23, 0, 100.024, 0
7, 24, 25, 0, 100.028, 0
8, 26, 27, 0, 100.032, 0
`;

const named = `sample_index,timestamp,C3,Cz,C4,marker
0, 0.000, -1, 2, 3, 0
1, 0.004, -1, 2, 3, 0
2, 0.008, -1, 2, 3, 0
3, 0.012, -1, 2, 3, 0
4, 0.016, -1, 2, 3, 0
5, 0.020, -1, 2, 3, 0
6, 0.024, -1, 2, 3, 0
7, 0.028, -1, 2, 3, 0
8, 0.032, -1, 2, 3, 0
`;

describe("OpenBCI CSV import", () => {
  it("reads a GUI header, the sample rate, and the Cyton montage", () => {
    const table = parseOpenBciCsv(gui);
    expect(table.sampleRateFromHeader).toBe(250);
    expect(table.unitsHint).toBe("uV");
    expect(table.sampleRateFromTime).toBe(250);
    expect(table.columns[1].electrode).toBe("C3");
    expect(table.columns[2].electrode).toBe("Cz");
    expect(table.columns[3].kind).toBe("skip");
  });

  it("reads electrode names from a BrainFlow-style table", () => {
    const table = parseOpenBciCsv(named);
    const electrodes = table.columns.map((column) => (column.kind === "eeg" ? column.electrode : ""));
    const samples = samplesFromTable(table, electrodes, "uV");
    expect(Object.keys(samples)).toEqual(["C3", "Cz", "C4"]);
    expect(samples.C3[0]).toBe(-1);
  });

  it("scales raw counts into microvolts only when asked", () => {
    const table = parseOpenBciCsv(named);
    const electrodes = table.columns.map((column) => (column.kind === "eeg" ? column.electrode : ""));
    const samples = samplesFromTable(table, electrodes, "counts");
    expect(samples.Cz[0]).toBeCloseTo(2 * CYTON_UV_PER_COUNT, 8);
  });

  it("rejects a file that is not a table", () => {
    expect(() => parseOpenBciCsv("hello\nthis is notes\n")).toThrow();
  });

  it("rejects two columns mapped to one electrode", () => {
    const table = parseOpenBciCsv(named);
    expect(() => samplesFromTable(table, ["", "", "C3", "C3", "C3", ""], "uV")).toThrow(/more than one/);
  });
});
