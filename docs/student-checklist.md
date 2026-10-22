# Exploring and extending the project

Use this guide to understand the calculations, review the lessons, and extend the project. Keep data provenance and units visible when adding features.

## Review and practice

- Run `npm test` and the Python unit test. If a sine-wave test fails, the spectrum code is wrong.
- Open the eyes lesson for S001 and S002. Write down both alpha results in your own words, including a result that does not match the textbook.
- Read `preprocessing/signal_math.py` and `src/signal/welch.ts` side by side. The band edges are supposed to match.
- Read `src/signal/rPeaks.ts`. The heart lesson prefers the file's annotations. The detector is the backup.
- Record your own eyes-open / eyes-closed CSV in the OpenBCI GUI and upload it. Compare it with S001. That is your data.
- Add one quiz question in the lesson file you understand best.
- Add another PhysioNet subject if you want a third person: drop the two EDF files in `data/raw` and extend `EEG_RUNS`.
- On a phone, walk the guided demo and fix any control that does not fit.

## Leave alone, on purpose

- Do not wire this lab to a motor-imagery classifier. The movement page is a labeled recording, not a decoder.
- Do not mark blinks on the PhysioNet baseline files. Do not bundle a synthetic pulse and call it a blink recording.
- Do not put volunteer age or sex from the ECG headers into the interface.
- Do not set `LIVE_BRIDGE_TESTED` to true until a Cyton has actually streamed into the page.
- Do not describe a coming-soon lab as if it has data.

## Files that repay a careful read

- `preprocessing/prepare_data.py` — how an EDF becomes the JSON the site loads
- `src/brain/EyesLesson.tsx` — prediction, shared scale, and the "do not force the result" wording
- `src/heart/RateLesson.tsx` — the BPM arithmetic, shown with the peaks you picked
- `src/openbci/parseCsv.ts` — why GUI exports and named tables are handled differently
- `src/labs/registry.ts` — how a future lab gets a name without pretending to work
- `src/action/blinkDetect.ts` — threshold, duration, and the refractory wait. A mark is not automatically a blink.
