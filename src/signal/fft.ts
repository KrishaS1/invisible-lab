/** In-place radix-2 complex FFT. Length must be a power of two. */
export function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const swapReal = real[i];
      real[i] = real[j];
      real[j] = swapReal;
      const swapImag = imag[i];
      imag[i] = imag[j];
      imag[j] = swapImag;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wlenReal = Math.cos(angle);
    const wlenImag = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let wReal = 1;
      let wImag = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j++) {
        const evenReal = real[i + j];
        const evenImag = imag[i + j];
        const oddReal = real[i + j + half] * wReal - imag[i + j + half] * wImag;
        const oddImag = real[i + j + half] * wImag + imag[i + j + half] * wReal;
        real[i + j] = evenReal + oddReal;
        imag[i + j] = evenImag + oddImag;
        real[i + j + half] = evenReal - oddReal;
        imag[i + j + half] = evenImag - oddImag;
        const nextReal = wReal * wlenReal - wImag * wlenImag;
        wImag = wReal * wlenImag + wImag * wlenReal;
        wReal = nextReal;
      }
    }
  }
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
