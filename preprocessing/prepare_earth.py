"""Convert two genuine STEAD examples and their manual P/S labels to browser JSON.
Usage: python preprocessing/prepare_earth.py --source-dir work
Requires numpy and h5py. Source downloads and checksums: seismic-source.json.
No response correction, filtering, time shifting, or synthetic samples are applied.
"""
import argparse, csv, hashlib, json
from pathlib import Path
import h5py
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, default=Path('public/data/earth/stead-examples.json'))
args = parser.parse_args()
manifest = json.loads((args.source_dir / 'seismic-source.json').read_text(encoding='utf-8'))
for name, meta in manifest['files'].items():
    assert hashlib.sha256((args.source_dir / name).read_bytes()).hexdigest() == meta['sha256']
rows = list(csv.DictReader((args.source_dir / '100samples.csv').open(encoding='utf-8')))
names = ['109C.TA_20060723155859_EV', '109C.TA_20061103155652_EV']
records = []
with h5py.File(args.source_dir / '100samples.hdf5', 'r') as f:
    for name in names:
        row = next(r for r in rows if r['trace_name'] == name)
        data = f['data'][name]
        assert data.shape == (6000, 3) and np.isfinite(data[:]).all()
        assert row['p_status'] == row['s_status'] == 'manual'
        p, s = int(float(row['p_arrival_sample'])), int(float(row['s_arrival_sample']))
        assert int(data.attrs['p_arrival_sample']) == p and int(data.attrs['s_arrival_sample']) == s
        assert 0 < p < s < 3000
        records.append(dict(id=name, station=f"{row['network_code']}.{row['receiver_code']}",
            startTime=row['trace_start_time']+' UTC', originTime=row['source_origin_time']+' UTC',
            sfreq=100, durationS=60, unit='counts', components=['E','N','Z'],
            samples={c: np.round(data[:, i].astype(float),4).tolist() for i,c in enumerate(['E','N','Z'])},
            pSample=p,sSample=s,pStatus=row['p_status'],sStatus=row['s_status'],
            magnitude=float(row['source_magnitude']), magnitudeType=row['source_magnitude_type'],
            eventLatitude=float(row['source_latitude']),eventLongitude=float(row['source_longitude']),
            stationLatitude=float(row['receiver_latitude']),stationLongitude=float(row['receiver_longitude'])))
result=dict(origin='STEAD',license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',
    citation='Mousavi, S. M., Sheng, Y., Zhu, W., and Beroza, G. C. (2019). STEAD dataset. IEEE Access. doi:10.1109/ACCESS.2019.2947848.',
    sourceRepository='https://github.com/smousavi05/STEAD',sampleRepository='https://github.com/smousavi05/EQTransformer',
    source=manifest, processing='STEAD source waveforms are detrended, demeaned, and resampled at 100 Hz. This app preserves the supplied samples, rounds to four decimal places, and converts HDF5 to JSON. E, N, Z component order follows the STEAD documentation. Amplitudes remain instrument counts; no instrument response correction is applied. Manual arrival indices are cross-checked against both CSV and HDF5 metadata.',records=records)
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
print([(r['id'],r['pSample']/100,r['sSample']/100) for r in records])
