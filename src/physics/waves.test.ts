import {describe,expect,it} from "vitest";
import {combinedAmplitude,waveValues,waveCoefficients} from "./waves";
describe("ideal sound-wave interference",()=>{
 it("reinforces equal in-phase waves and cancels equal opposite waves",()=>{expect(combinedAmplitude(1,0)).toBeCloseTo(2,12);expect(combinedAmplitude(1,180)).toBeLessThan(1e-12);expect(combinedAmplitude(1,360)).toBeCloseTo(2,12);});
 it("does not fully cancel unequal waves",()=>{expect(combinedAmplitude(.4,180)).toBeCloseTo(.6,12);expect(combinedAmplitude(0,180)).toBe(1);expect(combinedAmplitude(1,90)).toBeCloseTo(Math.sqrt(2),12);});
 it("adds signed samples point by point and leaves zero output at every phase of an opposite pair",()=>{for(let i=0;i<100;i++){const w=waveValues(i/997,220,1,180);expect(w.sum).toBeCloseTo(0,11);expect(w.sum).toBe(w.a+w.b);}});
 it("uses the same Fourier coefficients for audible and displayed waves",()=>{for(const phase of [0,45,90,180,270,360])for(const mode of ['sum','a','b'] as const){const [cos,sin]=waveCoefficients(.7,phase,mode);for(const t of [.0001,.001,.005]){const w=waveValues(t,330,.7,phase);const audio=cos*Math.cos(2*Math.PI*330*t)+sin*Math.sin(2*Math.PI*330*t);expect(audio).toBeCloseTo(w[mode],12);}}});
});
