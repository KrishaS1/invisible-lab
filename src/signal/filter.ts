// 4th-order Butterworth as two biquads, then zero-phase filtfilt.
// Q values are 1 / (2 sin((2k+1)π / (2N))) for N = 4.

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function butterworthQs(order: number): number[] {
  const qs: number[] = [];
  for (let k = 0; k < order / 2; k++) {
    qs.push(1 / (2 * Math.sin(((2 * k + 1) * Math.PI) / (2 * order))));
  }
  return qs;
}

function section(kind: "lowpass" | "highpass", cutoffHz: number, sfreq: number, q: number): Biquad {
  const w0 = (2 * Math.PI * cutoffHz) / sfreq;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * q);
  const a0 = 1 + alpha;
  if (kind === "lowpass") {
    const b0 = (1 - cos) / 2;
    return { b0: b0 / a0, b1: (1 - cos) / a0, b2: b0 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
  }
  const b0 = (1 + cos) / 2;
  return { b0: b0 / a0, b1: -(1 + cos) / a0, b2: b0 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function applyBiquad(input: number[], s: Biquad): number[] {
  const output = new Array<number>(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = s.b0 * x0 + s.b1 * x1 + s.b2 * x2 - s.a1 * y1 - s.a2 * y2;
    output[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return output;
}

function oddExtend(input: number[], pad: number): number[] {
  const output = new Array<number>(input.length + pad * 2);
  const last = input.length - 1;
  for (let i = 0; i < pad; i++) {
    const source = Math.min(last, pad - i);
    output[i] = 2 * input[0] - input[source];
    const tail = Math.max(0, last - 1 - i);
    output[pad + input.length + i] = 2 * input[last] - input[tail];
  }
  for (let i = 0; i < input.length; i++) output[pad + i] = input[i];
  return output;
}

function filtfilt(input: number[], sections: Biquad[]): number[] {
  if (input.length < 8) {
    throw new Error("Need a longer recording before filtering.");
  }
  const pad = Math.min(input.length - 1, Math.max(24, sections.length * 9));
  let y = oddExtend(input, pad);
  for (const s of sections) y = applyBiquad(y, s);
  y.reverse();
  for (const s of sections) y = applyBiquad(y, s);
  y.reverse();
  return y.slice(pad, pad + input.length);
}

export function bandpass(samples: ArrayLike<number>, sfreq: number, low: number, high: number): number[] {
  if (high >= sfreq / 2) {
    throw new Error(`High cutoff ${high} Hz is at or above the Nyquist frequency.`);
  }
  const input = Array.from(samples);
  const qs = butterworthQs(4);
  const sections = [
    ...qs.map((q) => section("highpass", low, sfreq, q)),
    ...qs.map((q) => section("lowpass", high, sfreq, q)),
  ];
  return filtfilt(input, sections);
}
