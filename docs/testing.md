# Testing

## Automated

Python, from the `preprocessing` folder, with the virtualenv active:

```bash
python -m unittest test_signal_math.py
```

That file uses sines and a spike train. It does not touch the PhysioNet files.

JavaScript, from the project folder:

```bash
npm test
```

Vitest checks:

- a 10 Hz sine lands in alpha, near amplitude squared over 2
- a 2 Hz sine lands in delta and a 20 Hz sine lands in beta
- a DC offset does not create alpha
- BPM = 60 / R–R
- a 60 bpm spike train
- OpenBCI GUI and named-electrode CSV parsing, including a bad file
- future labs have no experiments
- bundled JSON, after `prepare_data.py`, has 160 Hz EEG, O1/O2, 500 Hz ECG, and increasing peak indices
- a synthetic blink-sized pulse is marked, a short spike and a long drift are not, and noise under the threshold produces no marks
- two pulses inside the refractory period collapse to one mark
- the scanner steps Water, Help, Yes, No, then wraps
- recorded mode refuses to turn on until a file is accepted, and a mode change resets the scan clock
- the guided-demo script is problem, EEG, ECG, manual Blink-to-Select, headset explanation, future names. It does not start a live stream

## By hand

- Home: Start exploring opens Brain lab. Guided demo walks all 11 steps. Coming-soon rows open a page with no chart.
- Eyes lesson: switch S001 and S002. The alpha table changes. The shared vertical scale is the same on both traces.
- Bands: pick an electrode on the head diagram. The numbers follow that channel.
- Movement: switch real and imagined. The T1/T2 sentence changes with the run.
- Artifacts: the PhysioNet trace has no blink marks. The blink picture is labeled as a sketch.
- Listen: sound stays off until the button is pressed. The bar moves without sound too.
- Heart rate: pick two neighboring peaks, type 60 divided by the interval, and compare. Pick two that are not neighbors and read the warning.
- Playback: play, pause, restart, and the time slider, on EEG and ECG.
- Upload: a file with no header shows an error and does not draw a wave. A real OpenBCI CSV asks you to confirm columns and units.
- Live, with no bridge running: the page says the bridge is down and links back to PhysioNet and upload. The chart stays empty.
- Phone width: the lab links wrap, the menu opens, and the charts stay inside the screen.
- Science in Action: the four choices highlight in order. Space or Select picks the lit one in manual mode. Recorded EEG stays disabled until a CSV is loaded and the marks are accepted. Switching back to manual does not keep playing a recording into the board.
- Guided demo: eight steps, ending on the named-only labs. Part 4 is the manual board.

`npm run build` must finish before you deploy. The build runs the TypeScript check first.

## Checked while building this copy

- `python -m unittest test_signal_math.py` from `preprocessing`: 4 tests passed.
- `npm test`: 30 tests passed, including the blink detector, the scanner, mode switching, and the guided-demo script.
- `npm run build`: TypeScript check and Vite build finished. The JavaScript bundle is one chunk, a bit over 700 kB before gzip, because the chart library is included.
- `python bridge/openbci_bridge.py --self-test`: passed with the `websockets` package and no board. BrainFlow was not installed. The test does not mean a Cyton works.


## October 20 student-experience and tour review

- Checked all eight revised Quick Tour chapters in the browser: welcome, EEG playback, prediction/reveal, ECG playback, interval/BPM reveal, manual scanning selection, optional own-data setup, and actionable next-lab links.
- Verified real EEG/ECG playback controls, S001 alpha comparison (235 vs 3402 µV²), a 0.874-second R–R interval yielding 68.6 bpm, and a successful Yes selection on the manual board.
- Added a Learn more hub with six external resources and topic filters. Verified that the brain filter leaves the two brain resources and that the glossary and measuring links remain available.
- Replaced sparkle motifs and the floating logo tile with original line drawings of scientific subjects.
- Heart progress now uses the actual heart-rate / heart-beat / heart-listen quiz keys. Heart rate selection identifies first/second beats, supports clearing, and requires neighboring peaks for the calculation submission.
- EEG comparisons now use a shared full-range voltage domain. ECG voltage ticks preserve decimals below 1 mV.
- Source links were researched using the publishers' pages/search results. YouTube video availability was identified in search; direct video playback was not verified.
- No physical OpenBCI hardware was tested. Browser checks are not a formal student usability study.


## Physics and Earth Lab validation - October 20, 2026

- New physics tests verify constructive/destructive interference, incomplete cancellation with unequal amplitudes, pointwise signed superposition, and equality between the graph equations and the Fourier coefficients used for sound.
- New Earth tests validate full finite three-component traces, 100 Hz sample rates, manual P/S labels, source commit metadata, retained license, exact S–P intervals (11.94 s and 11.63 s), and rejection of incomplete/non-finite/reversed-arrival data.
- Browser: Physics cancellation preset displays zero amplitude and zero mean-square ratio. Explicit audio activation succeeds; deliberate cancellation-to-silence is explained. A-alone comparison and Stop sound work.
- Browser: Earth prediction enables reveal; student picks at 7.00/18.90 seconds produce an 11.90-second interval and compare to manual references of 7.00/18.94 seconds. Second recording shows 6.00/17.63 seconds and 11.63 seconds difference. Horizontal-component switching works.
- Browser engine activation is verified; physical speaker output is not directly heard. These checks do not replace student usability testing.
