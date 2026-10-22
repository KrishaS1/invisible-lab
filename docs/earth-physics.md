# Physics and Earth laboratories

Both labs are linked from the home page, header, knowledge base, and the final chapter of Quick Tour. Gene, Space, and Muscle remain coming soon.

## Run

`npm run dev` starts the existing Vite app. No new JavaScript packages or hardware are required. Prepared seismic JSON ships in public/data/earth. Normal use never fetches seismic data from a third party.

## Physics model

A(t) = sin(2πft), B(t) = b sin(2πft + φ), sum = A + B. Combined peak amplitude is hypot(1 + b cos φ, b sin φ). This is stable at cancellation. The chart uses the same signed sample equations. The audio uses the corresponding sine/cosine Fourier coefficients with periodic-wave normalization disabled; otherwise the browser could normalize away the intended amplitude change. Separate low listening gain prevents clipping at the maximum combined amplitude. Audio starts only after an explicit button press and is closed on navigation.

## Earth source and reproducibility

STEAD sample data is licensed CC BY 4.0. The full license and attribution ship with the app. Source URLs are pinned to a Git commit, and SHA-256 hashes are included in the public JSON.

To reproduce from the project root:

```
node --use-system-ca preprocessing/download_earth.mjs data/raw/earth
python -m pip install -r preprocessing/requirements-earth.txt
python preprocessing/prepare_earth.py --source-dir data/raw/earth
```

The downloader verifies hashes before writing the source files. The converter verifies them again, checks labels against both HDF5 and CSV, and preserves all 6000 samples in each of three components for each record. The original STEAD preprocessing detrended, demeaned, and resampled to 100 Hz. This converter adds only four-decimal rounding and JSON packaging. The lesson shows 0–30 seconds without modifying pick indices.

| Trace | Published P | Published S | S–P |
| --- | --- | --- | --- |
| 109C.TA_20060723155859_EV | 7.00 s | 18.94 s | 11.94 s |
| 109C.TA_20061103155652_EV | 6.00 s | 17.63 s | 11.63 s |

Components are E/N/Z. Values are instrument counts, not meters, velocity, acceleration, earthquake magnitude, or damage estimates. Source metadata says both arrival types are manual. Reference arrivals come from the supplied manual labels; the app does not infer phase arrivals.

## Student walkthrough

Physics: predict, listen to A alone, choose A+B, test 0°/90°/180°, reduce tone B amplitude, compare graph and output, answer the quiz.

Earth: predict, pick a recording and component, use Play/time slider to inspect onsets, mark P and S at the playhead, reveal source picks, compare intervals, then answer the magnitude-limits quiz. Changing records clears marks and pauses playback.
