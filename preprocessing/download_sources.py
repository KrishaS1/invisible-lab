"""Download the few PhysioNet files Invisible Lab actually uses.

This script does not download the full EEG Motor Movement/Imagery dataset.
That archive is many gigabytes. A file-by-file download of every subject
can run for hours. We only need:

- two people's eyes-open and eyes-closed baselines (R01, R02)
- one real-movement run and one imagined-movement run (S001 R03, R04)
- three short ECG-ID recordings

Files land in data/raw inside this project. Nothing is written elsewhere.
"""

from __future__ import annotations

import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"

EEG_RUNS = [
    ("S001", "S001R01.edf"),
    ("S001", "S001R02.edf"),
    ("S001", "S001R03.edf"),
    ("S001", "S001R04.edf"),
    ("S002", "S002R01.edf"),
    ("S002", "S002R02.edf"),
]

ECG_RECORDS = ["Person_01/rec_1", "Person_02/rec_1", "Person_05/rec_1"]
ECG_SUFFIXES = [".hea", ".dat", ".atr"]

EEG_BASE = "https://physionet.org/files/eegmmidb/1.0.0"
ECG_BASE = "https://physionet.org/files/ecgiddb/1.0.0"


def fetch(url: str, dest: Path, minimum_bytes: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size >= minimum_bytes:
        print(f"already have {dest.relative_to(ROOT)}")
        return
    print(f"downloading {url}")
    request = urllib.request.Request(url, headers={"User-Agent": "invisible-lab-prep"})
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = response.read()
    if len(payload) < minimum_bytes:
        raise RuntimeError(f"{url} returned only {len(payload)} bytes")
    # PhysioNet error pages are HTML. EDF and WFDB files are not.
    if payload.lstrip().startswith(b"<"):
        raise RuntimeError(f"{url} returned an HTML page, not the recording")
    dest.write_bytes(payload)
    print(f"saved {dest.relative_to(ROOT)} ({len(payload)} bytes)")


def main() -> None:
    for subject, name in EEG_RUNS:
        url = f"{EEG_BASE}/{subject}/{name}"
        dest = RAW / "eegmmidb" / subject / name
        fetch(url, dest, minimum_bytes=200_000)
        header = dest.read_bytes()[:8]
        if not header.startswith(b"0"):
            raise RuntimeError(f"{dest.name} does not look like an EDF file")

    for record in ECG_RECORDS:
        for suffix in ECG_SUFFIXES:
            url = f"{ECG_BASE}/{record}{suffix}"
            dest = RAW / "ecgiddb" / f"{record}{suffix}"
            # Annotation files for a 20-second record are only a few dozen bytes.
            minimum = 20 if suffix == ".atr" else 80 if suffix == ".hea" else 200
            fetch(url, dest, minimum_bytes=minimum)

    print("done")


if __name__ == "__main__":
    main()
