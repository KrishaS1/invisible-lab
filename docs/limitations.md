# Scientific limitations

Read this before describing results in a video or a write-up.

- The app is not a medical device. It does not diagnose.
- Two EEG participants are examples. A result on S001 can disagree with S002, and either result can disagree with the textbook pattern.
- Posterior alpha often increases with eyes closed. The lesson reports the sign it actually measured. "About the same" means the closed-eye value is within 10% of the open-eye value.
- Absolute power is in µV². Relative power is that band divided by the sum of delta, theta, alpha, beta, and gamma as defined in the lab, not by the entire spectrum.
- The prepare script and the browser both use a 0.5–55 Hz 4th-order Butterworth band-pass (zero phase) and Welch's method with 4-second Hann windows and 50% overlap. The summary skips the first and last 2 seconds. The browser filter is a biquad form of that Butterworth. It is the same spec, not a bit-identical copy of SciPy.
- Gamma is only measured to 45 Hz. Higher gamma is not in this lab. Muscle activity can still dominate beta and gamma.
- The movement page is not a classifier and does not report an accuracy. Task labels are interpreted for R03 and R04 only.
- Baseline EEG files are not blink-annotated. The artifact page does not mark blinks. Blink-to-Select does not ship a verified blink file. Its detector marks threshold crossings on a file you load. Those marks are candidates. The usual Cyton montage is not a frontal blink montage.
- The tone is a Web Audio oscillator. Pitch follows alpha power. The brain did not produce that sound.
- ECG-ID records are 20 seconds and one lead. R and T annotations were not audited. Q and S on the beat page are the minimum samples within 80 ms of the annotated R peak. P waves are not annotated, so they are not marked.
- Heart-rate clicks follow the peak list the lesson is using. A missed peak means a missed click.
- The live bridge has not been hardware-tested. A failed connection leaves the live chart empty.
- Uploaded CSV values are only converted from Cyton counts when the student selects that unit.


## Physics and Earth

- Physics Lab uses ideal linear superposition of equal-frequency sine waves. Cancellation occurs in the digitally summed signal at a modeled point, not everywhere in a room. Output uses unnormalized Fourier coefficients so phase cancellation changes amplitude correctly. Volume is a separate listening gain. The displayed mean-square ratio is not calibrated sound pressure level or perceived loudness.
- Earth Lab ships two historical STEAD recordings from one station, not a representative global sample or an operational alert system. Manual labels are reference picks with uncertainty, not ground truth with unlimited precision.
- Seismic amplitudes remain instrument counts. No instrument response correction or magnitude/distance inference is performed. The graph displays the first 30 seconds of a 60-second, 100 Hz trace. E/N/Z traces have independent vertical scales when switching components, so wave heights across channels are not a calibrated comparison.
- The gap between arrivals is computed directly from source sample indices divided by sampling rate. It does not locate an earthquake without a suitable travel-time model and additional observations.
