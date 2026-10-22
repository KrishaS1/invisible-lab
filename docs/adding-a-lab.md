# Adding a lab

Labs are listed in `src/labs/registry.ts`. That list drives the home page. A lab is either `ready` or `soon`.

## A coming-soon lab

Add an object with `status: "soon"`, `experiments: []`, and a `later` sentence that says the lab is not built. Give it an `href` of `/soon/your-id`. Do not add a chart, and do not invent a sample recording.

`src/labs/registry.test.ts` lists the soon ids. Update that test when the list changes.

## A real lab

1. Add the registry entry with `status: "ready"` and real experiment links.
2. Add a route in `src/App.tsx`.
3. Put the page in its own folder, the way `src/brain` and `src/heart` are split.
4. If the data is a time series, reuse `Waveform`, `Playback`, `Prediction`, and `Quiz`.
5. If the data is a sequence, such as DNA, do not reuse the EEG chart. Gene lab is not a waveform.
6. Put a prepare script next to `preprocessing/prepare_data.py` if the files are large, and write JSON into `public/data`.
7. Show the source on the page. Say whether a figure is a recording, an upload, a live stream, or a sketch.

Science in Action ideas live in `src/action/apps.ts`. A `soon` entry has an empty `href` and a `later` sentence that says it is not built. Blink-to-Select is the only ready entry. Do not draw a fake chart for the others. Gene work, if you add it later, should read a sequence, not an EEG waveform.

Keep the lesson in this order: objective, question, prediction, the recording, the result, a short explanation, a check, and the citation.

Shared pieces already exist for the time-series labs. There is no plugin loader. A new lab is a folder and a route.
