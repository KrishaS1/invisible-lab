export function MeasurePage() {
  return (
    <div className="page narrow">
      <h1>How a measurement is collected</h1>
      <h2>EEG</h2>
      <p>
        Electrodes sit on the scalp in a standard pattern. The PhysioNet files use 64 positions from the 10-10 system, sampled at 160 times a second. The OpenBCI setup this project expects is an Ultracortex Mark IV with a Cyton board and eight electrodes: C3, Cz, C4, P3, Pz, P4, O1, and O2, usually sampled at 250 Hz.
      </p>
      <p>
        The voltage is tiny, so the board amplifies it. The file still contains drift, blinks, and muscle activity. A filter and a spectrum are tools for reading it. They do not make the recording cleaner than it was.
      </p>
      <h2>ECG</h2>
      <p>
        The ECG-ID recordings are 20 seconds of lead I, sampled at 500 Hz. Lead I looks across the heart from the right arm toward the left arm. Each file includes a raw lead and a filtered lead. The lessons use the filtered lead that came in the file, and they say so.
      </p>
      <h2>Earthquake recordings</h2><p>Earth Lab uses STEAD samples at 100 Hz with E, N, and Z components in instrument counts. Published manual P/S sample indices set the reference arrivals. These are historical recordings, not live alerts.</p><h2>Physics models</h2><p>Physics Lab generates ideal sine waves using explicit equations. It is a simulation, not a recording. The audio and graph use the same amplitudes and phase relationship.</p><h2>What this site stores</h2>
      <p>
        Prepared recordings ship with the site so the lessons work offline after the first load. Quiz answers stay in localStorage on this browser. There is no account. The ECG headers include volunteer age and sex, and those fields are not copied into the app.
      </p>
    </div>
  );
}
