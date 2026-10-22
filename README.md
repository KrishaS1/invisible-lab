# Invisible Lab

A browser lab for recordings you cannot see directly. The working modules are Brain Lab (EEG), Heart Lab (ECG), Earth Lab (real seismic recordings), Physics Lab (a labeled sound-wave simulation), and Blink-to-Select. Gene, Space, and Muscle labs remain planned.

Invisible Lab began with a personal interest in OpenBCI EEG measurements and the goal of making scientific exploration accessible without specialized equipment.

The lessons follow one loop: predict, experiment with a recording or explicitly labeled model, inspect the result, then answer a short check. Quiz answers stay in the browser. There is no account.

## Run it

You need Node.js 22 or newer and Python 3.11 or newer. The full steps, including another laptop, are in [docs/install.md](docs/install.md).

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python preprocessing/download_sources.py
python preprocessing/prepare_data.py
npm install
npm test
npm run dev
```

On macOS or Linux the virtualenv activator is `source .venv/bin/activate`.

Open the address Vite prints. Start exploring goes to Brain lab. Guided demo walks through one EEG comparison, one ECG, and the manual scanning board, without a headset. Science in Action is the Blink-to-Select page.

## What is real

- EEG comes from the PhysioNet EEG Motor Movement/Imagery Dataset, participants S001 and S002. Eyes open is run R01. Eyes closed is run R02. Movement is S001 R03 (real) and R04 (imagined).
- ECG comes from the PhysioNet ECG-ID Database, three 20-second lead I records.
- Band power is computed from those files. It is not a hand-drawn percentage.
- Upload accepts an OpenBCI GUI CSV or a header row that already names the electrodes. The same kind of file can drive Blink-to-Select after you accept the candidate marks.
- Blink-to-Select's manual mode does not use EEG. Recorded mode stays off until a file is loaded. No verified blink recording is included.

## New labs

- `/physics/interference`: ideal sine-wave superposition with phase/frequency/amplitude controls, source or summed audio, exact calculated amplitudes, and a quiz. Audio is opt-in. This is not recorded sound or a room-wide cancellation model.
- `/earth/arrivals`: two 100 Hz, three-component STEAD recordings with published manual P/S picks. Students mark times using the playhead and compare with source picks. Samples are in instrument counts, not calibrated ground motion. Source attribution and CC BY 4.0 license ship with the site.
- `/learn`: topic-filtered resources, including OpenStax, USGS, and the STEAD documentation.

The new labs run from bundled assets without hardware or a server API. To reproduce the Earth Lab bundle, see [docs/earth-physics.md](docs/earth-physics.md).

## What is not tested

The live Cyton bridge in `bridge/openbci_bridge.py` has not been tried with a board attached. A self-test without hardware did run: an empty port and a start request with no board both return an error, and the bridge emits no samples. BrainFlow is not installed in this project's virtualenv. The live page says the hardware path is untested, and it does not substitute a saved recording. See [docs/openbci.md](docs/openbci.md).

## Deploy

[docs/deployment.md](docs/deployment.md) covers Netlify and Vercel. The built site is static. It does not need a database.

## Project documentation

- [docs/citations.md](docs/citations.md)
- [docs/limitations.md](docs/limitations.md)
- [docs/testing.md](docs/testing.md)
- [docs/adding-a-lab.md](docs/adding-a-lab.md)
- [docs/student-checklist.md](docs/student-checklist.md)
