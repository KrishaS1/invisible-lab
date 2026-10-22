# Install

These steps are enough to run Invisible Lab on another Windows, macOS, or Linux laptop. Everything the scripts write stays inside this project folder.

## Tools

- Node.js 22 or newer, from https://nodejs.org
- Python 3.11, 3.12, or 3.13. Python 3.14 also worked on the machine that prepared the first copy, because NumPy, SciPy, MNE, and WFDB had wheels for it.
- A recent browser.

Check them:

```bash
node -v
python --version
```

## Python environment

From the project folder:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

macOS or Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` is the science stack: NumPy, SciPy, MNE-Python, and WFDB. The website does not import them. They are used once, to prepare the JSON files.

## Recordings

`preprocessing/download_sources.py` downloads six EEG runs and three ECG records. It does not download the full EEG Motor Movement/Imagery dataset (about 3 GB uncompressed). A full file-by-file download can run for hours. Do not point MNE's dataset downloader at the whole archive.

```bash
python preprocessing/download_sources.py
python preprocessing/prepare_data.py
```

Raw files land in `data/raw/`. Prepared files land in `public/data/`. The site loads the prepared JSON.

To add another subject later, put `S00xR01.edf` and `S00xR02.edf` under `data/raw/eegmmidb/S00x/` and add the subject to `EEG_RUNS` in `preprocessing/prepare_data.py`. Then run the prepare script again.

## Website

```bash
npm install
npm test
npm run dev
```

`npm test` includes synthetic sines and, after the prepare step, checks that the bundled files have the right sample rates and channel names.

`npm run build` writes `dist/`. `npm run preview` serves that folder.

## Optional live board

The live bridge is separate. The self-test only needs the `websockets` package. BrainFlow and pyserial are for a real Cyton:

```bash
pip install websockets
python bridge/openbci_bridge.py --self-test
```

When you are ready to plug in a board:

```bash
pip install -r bridge/requirements.txt
python bridge/openbci_bridge.py
```

The self-test checks that the bridge refuses to emit samples when no board is open. It does not claim the headset works. On the machine used to prepare this project, that self-test passed without BrainFlow and without a board. Details are in `docs/openbci.md`.
