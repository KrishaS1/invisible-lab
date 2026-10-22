import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("bundled PhysioNet files", () => {
  it("keeps real sample rates, channels, and finite band power", () => {
    expect(existsSync("public/data/catalog.json")).toBe(true);
    const catalog = JSON.parse(readFileSync("public/data/catalog.json", "utf8"));
    const open = JSON.parse(readFileSync("public/data/eeg/S001R01.json", "utf8"));
    const closed = JSON.parse(readFileSync("public/data/eeg/S001R02.json", "utf8"));
    const movement = JSON.parse(readFileSync("public/data/eeg/S001R03.json", "utf8"));
    expect(open.origin).toBe("physionet");
    expect(open.sfreq).toBe(160);
    expect(closed.sfreq).toBe(160);
    expect(open.subject).toBe("S001");
    expect(closed.subject).toBe("S001");
    expect(open.condition).toBe("eyes open");
    expect(closed.condition).toBe("eyes closed");
    expect(open.channels).toEqual(expect.arrayContaining(["O1", "O2", "C3", "C4"]));
    expect(open.samples.O1.length / open.sfreq).toBeCloseTo(open.durationS, 2);
    const share = Object.values(open.bands.O1.relative as Record<string, number>).reduce((sum, value) => sum + value, 0);
    expect(share).toBeGreaterThan(0.98);
    expect(share).toBeLessThan(1.02);
    expect(Number.isFinite(open.bands.O1.absoluteUv2.alpha)).toBe(true);
    expect(movement.annotations.some((event: { label: string }) => event.label === "T1")).toBe(true);
    expect(movement.annotations.some((event: { label: string }) => event.label === "T2")).toBe(true);

    const suggested = catalog.ecg.find((item: { suggested: boolean }) => item.suggested) ?? catalog.ecg[0];
    const ecg = JSON.parse(readFileSync(`public/data/ecg/${suggested.id}.json`, "utf8"));
    expect(ecg.sfreq).toBe(500);
    expect(ecg.origin).toBe("physionet");
    expect(ecg.samples.length / ecg.sfreq).toBeCloseTo(ecg.durationS, 2);
    const peaks = ecg.peaksUsed === "annotated" ? ecg.annotatedRPeaks : ecg.detectedRPeaks;
    expect(peaks.length).toBeGreaterThan(5);
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]).toBeGreaterThan(peaks[i - 1]);
    expect(ecg.medianBpm).toBeGreaterThan(35);
    expect(ecg.medianBpm).toBeLessThan(180);
  });
});
