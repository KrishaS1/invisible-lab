"""Band power and a small R-peak detector.

The browser copies these steps in src/signal. Band edges and the filter
limits need to stay the same in both places. Bundled PhysioNet numbers
are produced here. Uploaded files are measured in the browser.
"""

from __future__ import annotations

import numpy as np
from scipy import signal

# Upper edge is exclusive, except gamma, which includes 45 Hz.
BANDS = (
    ("delta", 0.5, 4.0, False),
    ("theta", 4.0, 8.0, False),
    ("alpha", 8.0, 13.0, False),
    ("beta", 13.0, 30.0, False),
    ("gamma", 30.0, 45.0, True),
)

# 55 Hz stays above the gamma band and below the Nyquist frequency of a
# 160 Hz recording (80 Hz). It also softens 60 Hz line noise.
POWER_LOW_HZ = 0.5
POWER_HIGH_HZ = 55.0


def power_high_hz(sfreq: float) -> float:
    # Keep the cutoff below Nyquist. 0.45 * sfreq leaves a little room.
    return min(POWER_HIGH_HZ, sfreq * 0.45)


def bandpass(samples: np.ndarray, sfreq: float, low: float, high: float) -> np.ndarray:
    if high >= sfreq / 2:
        raise ValueError(f"High cutoff {high} Hz is at or above Nyquist ({sfreq / 2} Hz).")
    sos = signal.butter(4, [low, high], btype="bandpass", fs=sfreq, output="sos")
    return signal.sosfiltfilt(sos, samples).astype(np.float64)


def welch_band_powers(samples: np.ndarray, sfreq: float, segment_s: float = 4.0) -> dict:
    """Absolute power in µV² (or the signal's unit squared) and relative power.

    Relative power is that band divided by the sum of the five bands above,
    not by an infinite spectrum. Welch uses a Hann window and 50% overlap.
    """
    nperseg = int(round(segment_s * sfreq))
    nperseg = min(nperseg, int(samples.size))
    if nperseg < 16:
        raise ValueError("Need at least 16 samples for a spectrum.")
    freqs, psd = signal.welch(
        samples,
        fs=sfreq,
        window="hann",
        nperseg=nperseg,
        noverlap=nperseg // 2,
        detrend="constant",
        scaling="density",
    )
    absolute = {}
    for name, lo, hi, include_hi in BANDS:
        if include_hi:
            mask = (freqs >= lo) & (freqs <= hi)
        else:
            mask = (freqs >= lo) & (freqs < hi)
        if int(mask.sum()) < 2:
            absolute[name] = 0.0
        else:
            absolute[name] = float(np.trapezoid(psd[mask], freqs[mask]))
    total = float(sum(absolute.values()))
    relative = {name: (value / total if total > 0 else 0.0) for name, value in absolute.items()}
    return {"absolute": absolute, "relative": relative, "total": total}


def summary_powers(samples: np.ndarray, sfreq: float, trim_s: float = 2.0) -> dict:
    trim = int(round(trim_s * sfreq))
    if samples.size > trim * 2 + int(sfreq):
        used = samples[trim:-trim]
    else:
        used = samples
    return welch_band_powers(used, sfreq, segment_s=4.0)


def band_timeline(samples: np.ndarray, sfreq: float, trim_s: float = 2.0) -> dict:
    """One power estimate every 2 seconds, from a 4-second window."""
    window = int(round(4 * sfreq))
    step = int(round(2 * sfreq))
    trim = int(round(trim_s * sfreq))
    times = []
    series = {name: [] for name, *_ in BANDS}
    start = trim
    last = samples.size - trim
    while start + window <= last:
        chunk = samples[start : start + window]
        powers = welch_band_powers(chunk, sfreq, segment_s=4.0)
        times.append((start + window / 2) / sfreq)
        for name, *_ in BANDS:
            series[name].append(powers["absolute"][name])
        start += step
    return {"windowS": 4.0, "stepS": 2.0, "times": times, "absolute": series}


def detect_r_peaks(samples: np.ndarray, sfreq: float) -> list[int]:
    """A short version of the Pan–Tompkins idea.

    Band-pass, derivative, square, smooth, then a refractory period so one
    heartbeat cannot be counted twice. The index is then nudged onto the
    tallest point of the band-passed beat, which is the R peak we want.
    """
    if samples.size < int(sfreq):
        return []
    low, high = 5.0, min(18.0, sfreq * 0.45)
    sos = signal.butter(2, [low, high], btype="bandpass", fs=sfreq, output="sos")
    filtered = signal.sosfiltfilt(sos, samples)
    derivative = np.diff(filtered, prepend=filtered[0])
    squared = derivative * derivative
    win = max(1, int(round(0.15 * sfreq)))
    integrated = np.convolve(squared, np.ones(win) / win, mode="same")
    threshold = 0.35 * float(np.percentile(integrated, 98))
    refractory = int(round(0.28 * sfreq))
    peaks: list[int] = []
    i = 1
    last = integrated.size - 1
    while i < last:
        if integrated[i] >= threshold and integrated[i] >= integrated[i - 1] and integrated[i] >= integrated[i + 1]:
            lo = max(0, i - int(round(0.08 * sfreq)))
            hi = min(integrated.size, i + int(round(0.04 * sfreq)))
            local = filtered[lo:hi]
            r_index = lo + int(np.argmax(local))
            if not peaks or r_index - peaks[-1] >= refractory:
                peaks.append(r_index)
            i += refractory
        else:
            i += 1
    return peaks
