import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="page narrow">
      <h1>About this lab</h1>
      <p>
        Invisible Lab grew from a personal interest in brain signals and a desire to make scientific experimentation more accessible. It is not a medical device, and it does not diagnose a heart condition, a seizure, a mood, or anything else.
      </p>
      <h2>Why I started</h2>
      <p>While working with an OpenBCI EEG headset for my science fair project, I learned how fascinating it is to measure electrical signals from the brain. I also saw how much equipment and background knowledge can stand between a student and that experience. I wanted to create a way for other students to investigate real data, even if they do not have access to a science lab.</p>
      <h2>What is finished</h2>
      <ul><li>Physics Lab: a labeled sine-wave simulation with phase, amplitude, frequency, interference, and optional synthesized sound.</li><li>Earth Lab: two real STEAD recordings with manual P/S labels, student picks, and measured arrival intervals.</li></ul>
      <ul>
        <li>Brain lab on real PhysioNet EEG: eyes open versus closed, frequency bands, movement labels, artifacts without fake blink marks, and a tone mapped to alpha power.</li>
        <li>Heart lab on real PhysioNet ECG-ID recordings: R peaks, a BPM calculation, one annotated beat, and clicks on those peaks.</li>
        <li>CSV upload for an OpenBCI GUI export or a named-electrode table.</li>
        <li>Science in Action: Blink-to-Select in manual mode. Recorded mode turns on only after you load a file and accept the candidate marks.</li>
      </ul>
      <h2>What is not finished</h2>
      <ul>
        <li>The live Cyton bridge is written and has not been tested with a board plugged in. The page says so, and it never fills the chart with a prerecorded file.</li>
        <li>No verified blink recording is bundled. The detector can mark large bumps in a file you supply. It does not prove those bumps are blinks.</li>
        <li>Gene, Space, and Muscle labs are names only. HeartBeat Art, Brain-to-Music, a muscle switch, seismic motion, and the gene explorer are names only.</li>
      </ul>
      <h2>Limits of the science</h2>
      <ul>
        <li>Two EEG participants and three short ECGs are examples, not a population.</li>
        <li>Scalp EEG is noisy and smeared by the skull. Band power is an estimate from a 4-second window.</li>
        <li>Gamma above 45 Hz is outside the bands used here. The filter stops at 55 Hz.</li>
        <li>ECG-ID is a biometric research set, one lead, 20 seconds. It is not a 12-lead clinical ECG. Its R and T marks came from an automatic detector and were not audited.</li>
        <li>Q and S on the beat page are the low points next to an annotated R peak. P waves are not marked, because the file does not mark them.</li>
      </ul>
      <p>
        Citations and the install steps are in the project docs. The <Link to="/glossary">glossary</Link> defines the terms.
      </p>
    </div>
  );
}
