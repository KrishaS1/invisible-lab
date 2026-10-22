import {waveCoefficients,type OutputMode} from "./waves";
export type WaveAudio={update:(frequency:number,b:number,phase:number,mode:OutputMode,volume:number)=>void;stop:()=>void};
export async function startWaveAudio():Promise<WaveAudio> {
 const AudioCtx=window.AudioContext || (window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
 if(!AudioCtx) throw Error("Audio is unavailable in this browser. The graphs still work.");
 const ctx=new AudioCtx();
 try {if(ctx.state!=="running") await ctx.resume();if(ctx.state!=="running")throw Error("Audio is blocked. Try the sound button again in Chrome or Edge.");}catch(error){void ctx.close();throw error;}
 const osc=ctx.createOscillator();const gain=ctx.createGain();gain.gain.value=0;
 osc.connect(gain);gain.connect(ctx.destination);osc.start();let stopped=false;
 return {update(f,b,phase,mode,volume){if(stopped)return;const [real,imag]=waveCoefficients(b,phase,mode);osc.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0,real]),new Float32Array([0,imag]),{disableNormalization:true}));osc.frequency.setTargetAtTime(f,ctx.currentTime,.02);gain.gain.setTargetAtTime(Math.max(0,Math.min(.15,volume)),ctx.currentTime,.03);},stop(){if(stopped)return;stopped=true;osc.stop();osc.disconnect();gain.disconnect();void ctx.close();}};
}
