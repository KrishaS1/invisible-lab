"""Synthetic signals only. Real recordings are checked by prepare_data.py."""

from __future__ import annotations

import unittest

import numpy as np

from signal_math import detect_r_peaks, welch_band_powers


class WelchTests(unittest.TestCase):
    def test_ten_hertz_sine_lands_in_alpha(self):
        sfreq = 160.0
        t = np.arange(0, 20, 1 / sfreq)
        # Amplitude 1. A sine's power is amplitude squared over 2.
        wave = np.sin(2 * np.pi * 10 * t)
        powers = welch_band_powers(wave, sfreq)
        alpha = powers["absolute"]["alpha"]
        self.assertAlmostEqual(alpha, 0.5, delta=0.08)
        self.assertGreater(powers["relative"]["alpha"], 0.9)

    def test_offset_does_not_create_alpha(self):
        sfreq = 160.0
        t = np.arange(0, 20, 1 / sfreq)
        wave = 10000 + np.sin(2 * np.pi * 10 * t)
        powers = welch_band_powers(wave, sfreq)
        self.assertAlmostEqual(powers["absolute"]["alpha"], 0.5, delta=0.08)

    def test_two_hertz_sine_lands_in_delta(self):
        sfreq = 160.0
        t = np.arange(0, 30, 1 / sfreq)
        wave = np.sin(2 * np.pi * 2 * t)
        powers = welch_band_powers(wave, sfreq)
        self.assertGreater(powers["relative"]["delta"], 0.8)


class RPeakTests(unittest.TestCase):
    def test_spike_train_at_60_bpm(self):
        sfreq = 500.0
        duration = 20.0
        samples = np.zeros(int(duration * sfreq))
        period = int(sfreq)  # 60 bpm
        width = int(0.012 * sfreq)
        for center in range(period, samples.size - period, period):
            sl = slice(center - width, center + width)
            samples[sl] += np.hanning(sl.stop - sl.start)
        peaks = detect_r_peaks(samples, sfreq)
        # Twenty seconds at 60 bpm, with the ends trimmed by the filter.
        self.assertGreaterEqual(len(peaks), 16)
        self.assertLessEqual(len(peaks), 20)
        intervals = np.diff(peaks) / sfreq
        bpm = 60 / float(np.median(intervals))
        self.assertAlmostEqual(bpm, 60, delta=2)


if __name__ == "__main__":
    unittest.main()
