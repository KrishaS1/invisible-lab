export function combinedAmplitude(amplitudeB: number, phaseDeg: number): number {
 const phase=phaseDeg*Math.PI/180;
 return Math.hypot(1+amplitudeB*Math.cos(phase),amplitudeB*Math.sin(phase));
}
export function waveValues(timeS:number,frequency:number,amplitudeB:number,phaseDeg:number) {
 const a=Math.sin(2*Math.PI*frequency*timeS);
 const b=amplitudeB*Math.sin(2*Math.PI*frequency*timeS+phaseDeg*Math.PI/180);
 return {a,b,sum:a+b};
}
export type OutputMode="sum"|"a"|"b";
export function waveCoefficients(amplitudeB:number,phaseDeg:number,mode:OutputMode):[number,number] {
 const phase=phaseDeg*Math.PI/180;
 if(mode==="a") return [0,1];
 return [amplitudeB*Math.sin(phase),(mode==="sum"?1:0)+amplitudeB*Math.cos(phase)];
}
