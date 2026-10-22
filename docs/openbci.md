# OpenBCI Cyton

The reliable way to bring your own EEG into Invisible Lab is the OpenBCI GUI, then a CSV upload. The live bridge is optional. Its no-hardware self-test has been run. It has not been tested with a board in this project.

Headset this was written for:

- Ultracortex Mark IV
- Cyton, 8 channels
- Electrode order: C3, Cz, C4, P3, Pz, P4, O1, O2

The board does not know those names. The GUI channel numbers have to match that order, and the upload page asks you to confirm the map.

## Record in the GUI

1. Install the OpenBCI GUI from the OpenBCI docs and plug the Cyton in over USB.
2. Start a session and check that the impedances look reasonable.
3. Sit still. Record about 30 seconds with eyes open, then about 30 seconds with eyes closed. Note the times.
4. Export the raw CSV.
5. In Invisible Lab, open Brain lab → Upload. Choose the file.
6. Confirm the sampling rate (250 Hz for a default Cyton session) and the units. Recent GUI exports are in microvolts. Choose "Cyton raw counts" only if you know the file is unscaled counts. The scale used is 4.5 V / 24 / (2^23 − 1), written out in microvolts per count.
7. Set the two time ranges and read the posterior alpha comparison. That comparison is labeled as your upload, not as PhysioNet.

A table that already has a header like `sample_index,timestamp,C3,Cz,C4,...` also imports. If the time column is not a steady sample clock, the page says so and keeps the rate you type.

## Live bridge

The browser cannot open the serial port itself. `bridge/openbci_bridge.py` is a small program on the same computer:

OpenBCI Cyton → BrainFlow → WebSocket on 127.0.0.1:8765 → the Live board page

```bash
pip install -r bridge/requirements.txt
python bridge/openbci_bridge.py --self-test
python bridge/openbci_bridge.py
```

Then run `npm run dev`, open the local site, and use Brain lab → Live board. Pick the serial port (often a COM port on Windows), open the board, then stream.

The bridge binds to localhost only. It does not open the board until you ask. If BrainFlow is missing, or the port is empty, it returns an error and sends no samples.

A hosted https site cannot call `ws://127.0.0.1`. Use the local dev server for live capture. The public site still has PhysioNet and CSV upload.

Saving a live capture downloads a JSON file and keeps it in the session so the Listen page can use it. The file's origin is "live" only when samples actually arrived.

Do not mark the bridge as tested until you have watched real samples move while the board is plugged in. `LIVE_BRIDGE_TESTED` in `src/openbci/liveClient.ts` is false on purpose.
