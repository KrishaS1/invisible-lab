"""Turn the downloaded PhysioNet files into the JSON the site loads.

Run this after download_sources.py. It writes public/data and does not
modify the raw files. Age and sex notes in the ECG headers are not copied
into the site.
"""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

import mne
import numpy as np
import wfdb

from signal_math import (
    POWER_LOW_HZ,
    band_timeline,
    detect_r_peaks,
    power_high_hz,
    summary_powers,
    bandpass,
)

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "public" / "data"

EEG_RUNS = [
    ("S001", "R01", "eyes open", "baseline"),
    ("S001", "R02", "eyes closed", "baseline"),
    ("S001", "R03", "real left or right fist", "motor"),
    ("S001", "R04", "imagined left or right fist", "motor"),
    ("S002", "R01", "eyes open", "baseline"),
    ("S002", "R02", "eyes closed", "baseline"),
]

# T1 and T2 do not mean the same thing in every run.
# https://physionet.org/content/eegmmidb/1.0.0/
MOTOR_LABELS = {
    "R03": {
        "T0": "rest",
        "T1": "open and close the left fist",
        "T2": "open and close the right fist",
    },
    "R04": {
        "T0": "rest",
        "T1": "imagine opening and closing the left fist",
        "T2": "imagine opening and closing the right fist",
    },
}

KEEP_CHANNELS = ["O1", "O2", "C3", "Cz", "C4", "Fp1", "Fp2"]

EEG_CITATION = (
    "Schalk, G., McFarland, D.J., Hinterberger, T., Birbaumer, N., Wolpaw, J.R. "
    "BCI2000: A General-Purpose Brain-Computer Interface (BCI) System. "
    "IEEE Transactions on Biomedical Engineering 51(6):1034-1043, 2004. "
    "Dataset: Schalk, G. EEG Motor Movement/Imagery Dataset, version 1.0.0. "
    "PhysioNet, 2009. https://doi.org/10.13026/C28G6P"
)

ECG_CITATION = (
    "Lugovaya, T.S. Biometric human identification based on electrocardiogram. "
    "Master's thesis, Electrotechnical University LETI, Saint Petersburg, 2005. "
    "ECG-ID Database, version 1.0.0, PhysioNet. "
    "https://physionet.org/content/ecgiddb/1.0.0/"
)

ECG_RECORDS = ["Person_01/rec_1", "Person_02/rec_1", "Person_05/rec_1"]

FILTER_NOTE = (
    "Band-pass 0.5–55 Hz, 4th-order Butterworth, zero phase "
    "(lower if the sampling rate cannot support 55 Hz). "
    "Welch method, Hann window, 4 s segments, 50% overlap. "
    "The summary skips the first and last 2 seconds."
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def clean_channel(name: str) -> str:
    # EDF labels in this dataset look like "O1.." and "Fp1."
    return name.replace(".", "").replace(" ", "")


def round_list(values: np.ndarray, digits: int) -> list[float]:
    return [round(float(value), digits) for value in values]


def round_powers(powers: dict) -> dict:
    absolute = {name: round(value, 4) for name, value in powers["absolute"].items()}
    relative = {name: round(value, 4) for name, value in powers["relative"].items()}
    return {"absoluteUv2": absolute, "relative": relative}


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")


def load_eeg(subject: str, run: str):
    path = RAW / "eegmmidb" / subject / f"{subject}{run}.edf"
    if not path.exists():
        raise FileNotFoundError(f"Missing {path}. Run download_sources.py first.")
    raw = mne.io.read_raw_edf(path, preload=True, verbose="ERROR")
    lookup = {clean_channel(name): name for name in raw.ch_names}
    present = [name for name in KEEP_CHANNELS if name in lookup]
    missing = [name for name in ("O1", "O2") if name not in lookup]
    if missing:
        raise RuntimeError(f"{path.name} is missing {missing}. Found {sorted(lookup)}.")
    original = [lookup[name] for name in present]
    picked = raw.get_data(picks=original)
    # MNE stores EEG in volts. A normal scalp standard deviation is well under 1 V.
    std = float(np.std(picked))
    scale = 1e6 if std < 0.01 else 1.0
    data = picked * scale
    sfreq = float(raw.info["sfreq"])
    high = power_high_hz(sfreq)
    filtered = np.vstack([bandpass(row, sfreq, POWER_LOW_HZ, high) for row in data])

    labels = MOTOR_LABELS.get(run, {})
    annotations = []
    for onset, duration, desc in zip(
        raw.annotations.onset, raw.annotations.duration, raw.annotations.description
    ):
        label = str(desc).strip()
        annotations.append(
            {
                "onset": round(float(onset), 3),
                "duration": round(float(duration), 3),
                "label": label,
                "meaning": labels.get(label, label),
            }
        )

    bands = {}
    timeline_power = {}
    samples = {}
    shared_times = None
    for index, name in enumerate(present):
        samples[name] = round_list(filtered[index], 2)
        summary = summary_powers(filtered[index], sfreq)
        bands[name] = round_powers(summary)
        timeline = band_timeline(filtered[index], sfreq)
        shared_times = timeline["times"]
        timeline_power[name] = {
            band: [round(value, 4) for value in values]
            for band, values in timeline["absolute"].items()
        }

    file_hp = raw.info["highpass"]
    file_lp = raw.info["lowpass"]
    record = {
        "id": f"{subject}{run}",
        "origin": "physionet",
        "dataset": "eegmmidb",
        "datasetName": "EEG Motor Movement/Imagery Dataset",
        "version": "1.0.0",
        "url": "https://physionet.org/content/eegmmidb/1.0.0/",
        "citation": EEG_CITATION,
        "subject": subject,
        "run": run,
        "condition": "",
        "task": "",
        "sfreq": sfreq,
        "unit": "uV",
        "unitScaleNote": "MNE volts converted to microvolts" if scale == 1e6 else "values used as stored",
        "fileHighpassHz": None if not file_hp else float(file_hp),
        "fileLowpassHz": None if not file_lp else float(file_lp),
        "filterHighHz": high,
        "filter": FILTER_NOTE,
        "channels": present,
        "samples": samples,
        "durationS": round(filtered.shape[1] / sfreq, 3),
        "bands": bands,
        "timeline": {
            "windowS": 4.0,
            "stepS": 2.0,
            "times": [round(value, 3) for value in shared_times or []],
            "absoluteUv2": timeline_power,
        },
        "annotations": annotations,
        "sha256": sha256_file(path),
        "sourceFile": path.name,
    }
    return record, std, scale


def _score_groups(groups: dict[str, list[int]], signal: np.ndarray) -> list[tuple]:
    scored = []
    skip = {"+", "~", "|", '"'}
    for symbol, indices in groups.items():
        if symbol in skip:
            continue
        amplitudes = [abs(float(signal[i])) for i in indices if 0 <= i < signal.size]
        score = float(np.median(amplitudes)) if amplitudes else 0.0
        scored.append((score, symbol, indices))
    scored.sort(key=lambda item: item[0], reverse=True)
    return scored


def split_r_and_t(ann_samples, ann_symbols, signal: np.ndarray, sfreq: float):
    groups: dict[str, list[int]] = {}
    for sample, symbol in zip(ann_samples, ann_symbols):
        groups.setdefault(str(symbol), []).append(int(sample))
    print("  annotation symbols:", dict(Counter(str(s) for s in ann_symbols)))
    scored = _score_groups(groups, signal)
    if not scored:
        return [], [], None, None
    r_symbol = None
    for _score, symbol, _indices in scored:
        if symbol.lower() in {"n", "r", "q", "v"}:
            r_symbol = symbol
            break
    if r_symbol is None:
        r_symbol = scored[0][1]
    r_peaks = sorted(groups[r_symbol])
    t_symbol = None
    for symbol in groups:
        if symbol.lower() == "t" or symbol == ")":
            t_symbol = symbol
            break
    t_peaks = sorted(groups[t_symbol]) if t_symbol else []
    return r_peaks, t_peaks, r_symbol, t_symbol


def example_beat(signal: np.ndarray, sfreq: float, r_peaks: list[int], t_peaks: list[int]) -> dict | None:
    if len(r_peaks) < 3:
        return None
    # A middle beat is less likely to sit on the filter edge.
    r_index = r_peaks[len(r_peaks) // 2]
    next_r = None
    for candidate in r_peaks:
        if candidate > r_index:
            next_r = candidate
            break
    if next_r is None:
        return None
    r_to_next = (next_r - r_index) / sfreq
    t_index = None
    for candidate in t_peaks:
        delay = (candidate - r_index) / sfreq
        if 0.08 < delay < min(0.45, r_to_next * 0.8):
            t_index = candidate
            break
    q_lo = max(0, r_index - int(round(0.08 * sfreq)))
    q_hi = max(q_lo + 1, r_index - int(round(0.01 * sfreq)))
    s_lo = min(signal.size - 1, r_index + int(round(0.01 * sfreq)))
    s_hi = min(signal.size, r_index + int(round(0.08 * sfreq)))
    q_index = q_lo + int(np.argmin(signal[q_lo:q_hi]))
    s_index = s_lo + int(np.argmin(signal[s_lo:s_hi]))
    view_start = max(0, r_index - int(round(0.35 * sfreq)))
    view_end = min(signal.size, r_index + int(round(0.55 * sfreq)))
    return {
        "rIndex": int(r_index),
        "qIndex": int(q_index),
        "sIndex": int(s_index),
        "tIndex": None if t_index is None else int(t_index),
        "viewStart": int(view_start),
        "viewEnd": int(view_end),
        "markMethod": (
            "R peaks are the file's beat annotations. "
            "Q and S are the lowest samples in the 80 ms before and after that R peak. "
            "T is the file's T annotation when one falls on this beat. "
            "P waves are not annotated in this dataset."
        ),
    }


def rr_stats(peaks: list[int], sfreq: float) -> dict | None:
    if len(peaks) < 3:
        return None
    intervals = np.diff(np.array(peaks, dtype=float)) / sfreq
    intervals = intervals[(intervals > 0.3) & (intervals < 2.0)]
    if intervals.size < 2:
        return None
    median = float(np.median(intervals))
    mean = float(np.mean(intervals))
    cv = float(np.std(intervals) / mean) if mean else 1.0
    return {"medianRrS": round(median, 4), "medianBpm": round(60 / median, 2), "cv": round(cv, 4)}


def load_ecg(record_name: str) -> dict:
    path = RAW / "ecgiddb" / record_name
    if not Path(str(path) + ".dat").exists():
        raise FileNotFoundError(f"Missing {record_name}. Run download_sources.py first.")
    record = wfdb.rdrecord(str(path))
    signal_index = 1 if record.p_signal.shape[1] > 1 else 0
    signal = np.asarray(record.p_signal[:, signal_index], dtype=np.float64)
    sfreq = float(record.fs)
    ann = wfdb.rdann(str(path), "atr")
    r_peaks, t_peaks, r_symbol, t_symbol = split_r_and_t(ann.sample, ann.symbol, signal, sfreq)
    detected = detect_r_peaks(signal, sfreq)
    used = r_peaks if len(r_peaks) >= 5 else detected
    peaks_used = "annotated" if used is r_peaks else "detected"
    stats = rr_stats(used, sfreq)
    matches = 0
    tolerance = int(round(0.05 * sfreq))
    for peak in r_peaks:
        if any(abs(peak - other) <= tolerance for other in detected):
            matches += 1
    person, rec = record_name.split("/")
    payload = {
        "id": record_name.replace("/", "_"),
        "origin": "physionet",
        "dataset": "ecgiddb",
        "datasetName": "ECG-ID Database",
        "version": "1.0.0",
        "url": "https://physionet.org/content/ecgiddb/1.0.0/",
        "citation": ECG_CITATION,
        "person": person,
        "record": rec,
        "sfreq": sfreq,
        "unit": str(record.units[signal_index]),
        "lead": str(record.sig_name[signal_index]),
        "leadNote": "Signal 1 is the filtered lead I stored in the file."
        if signal_index == 1
        else "This file had one signal, and that signal is shown.",
        "samples": round_list(signal, 4),
        "durationS": round(signal.size / sfreq, 3),
        "annotatedRPeaks": r_peaks,
        "annotatedTPeaks": t_peaks,
        "rSymbol": r_symbol,
        "tSymbol": t_symbol,
        "detectedRPeaks": detected,
        "detectorMatches": matches,
        "peaksUsed": peaks_used,
        "medianRrS": None if stats is None else stats["medianRrS"],
        "medianBpm": None if stats is None else stats["medianBpm"],
        "intervalCv": None if stats is None else stats["cv"],
        "exampleBeat": example_beat(signal, sfreq, used, t_peaks),
        "sha256": sha256_file(Path(str(path) + ".dat")),
        "sourceFile": record_name,
    }
    return payload


def posterior_alpha(record: dict) -> float:
    values = [record["bands"][name]["absoluteUv2"]["alpha"] for name in ("O1", "O2")]
    return float(sum(values) / len(values))


def main() -> None:
    eeg_catalog = []
    by_subject: dict[str, dict[str, float]] = {}
    for subject, run, condition, task in EEG_RUNS:
        print(f"EEG {subject} {run}")
        record, std, scale = load_eeg(subject, run)
        record["condition"] = condition
        record["task"] = task
        write_json(OUT / "eeg" / f"{record['id']}.json", record)
        alpha = posterior_alpha(record)
        by_subject.setdefault(subject, {})[run] = alpha
        print(
            f"  std_before_scale={std:.6g} scale={scale} "
            f"sfreq={record['sfreq']} duration={record['durationS']} "
            f"posterior_alpha={alpha:.3f} events={len(record['annotations'])}"
        )
        eeg_catalog.append(
            {
                "id": record["id"],
                "subject": subject,
                "run": run,
                "condition": condition,
                "task": task,
            }
        )

    print("Eyes-closed alpha / eyes-open alpha (mean of O1 and O2):")
    for subject, runs in by_subject.items():
        if "R01" in runs and "R02" in runs and runs["R01"] > 0:
            print(f"  {subject}: open={runs['R01']:.3f} closed={runs['R02']:.3f} ratio={runs['R02'] / runs['R01']:.3f}")

    ecg_payloads = []
    for name in ECG_RECORDS:
        print(f"ECG {name}")
        payload = load_ecg(name)
        ecg_payloads.append(payload)
        print(
            f"  sfreq={payload['sfreq']} unit={payload['unit']} lead={payload['lead']} "
            f"annotated={len(payload['annotatedRPeaks'])} detected={len(payload['detectedRPeaks'])} "
            f"matches={payload['detectorMatches']} bpm={payload['medianBpm']} "
            f"t_peaks={len(payload['annotatedTPeaks'])}"
        )

    usable = [item for item in ecg_payloads if item["intervalCv"] is not None]
    if not usable:
        raise RuntimeError("No ECG record produced a heart-rate estimate.")
    suggested = min(usable, key=lambda item: item["intervalCv"])
    ecg_catalog = []
    for payload in ecg_payloads:
        payload["suggested"] = payload["id"] == suggested["id"]
        write_json(OUT / "ecg" / f"{payload['id']}.json", payload)
        ecg_catalog.append(
            {
                "id": payload["id"],
                "person": payload["person"],
                "record": payload["record"],
                "suggested": payload["suggested"],
                "medianBpm": payload["medianBpm"],
            }
        )
    print(f"Suggested ECG for the lesson: {suggested['id']} (steadiest annotated intervals)")

    write_json(
        OUT / "catalog.json",
        {
            "eeg": eeg_catalog,
            "ecg": ecg_catalog,
            "filter": FILTER_NOTE,
        },
    )


if __name__ == "__main__":
    main()
