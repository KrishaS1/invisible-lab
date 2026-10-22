// These browser-generated sounds represent measurements, not recorded body sounds.
export type ToneHandle = {
  setVolume: (volume: number) => void;
  setPitch: (hz: number) => void;
  stop: () => void;
};

function audioContext(): AudioContext {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) throw new Error("This browser does not support audio. Try opening the lab in Chrome or Edge.");
  return new AudioCtx();
}

async function resumeAudio(ctx: AudioContext) {
  if (ctx.state !== "running") await ctx.resume();
  if (ctx.state !== "running") throw new Error("Audio is blocked. Click the sound button again, or open the lab in Chrome or Edge.");
}

export async function startTone(volume: number): Promise<ToneHandle> {
  // Called directly by the sound button so browser autoplay rules allow audio.
  const ctx = audioContext();
  try {
    await resumeAudio(ctx);
  } catch (error) {
    void ctx.close();
    throw error;
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 330;
  gain.gain.value = Math.max(0, Math.min(0.4, volume));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  let stopped = false;
  return {
    setVolume(next) {
      if (!stopped) gain.gain.setTargetAtTime(Math.max(0, Math.min(0.4, next)), ctx.currentTime, 0.05);
    },
    setPitch(hz) {
      if (!stopped) osc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.08);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      osc.stop();
      osc.disconnect();
      gain.disconnect();
      void ctx.close();
    },
  };
}

export function pitchFromAlpha(value: number, min: number, max: number): number {
  const span = Math.max(max - min, 1e-9);
  const norm = Math.min(1, Math.max(0, (value - min) / span));
  return 220 + norm * 220;
}

export type HeartAudio = { thump: (volume: number) => void; stop: () => void };

export async function startHeartAudio(): Promise<HeartAudio> {
  // Initialize/resume during the button click, before playback timers fire.
  const ctx = audioContext();
  try {
    await resumeAudio(ctx);
  } catch (error) {
    void ctx.close();
    throw error;
  }
  return {
    thump(volume) {
      if (ctx.state !== "running" || volume <= 0) return;
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      // Midrange pulse remains audible on small laptop speakers.
      osc.frequency.setValueAtTime(440, time);
      osc.frequency.exponentialRampToValueAtTime(220, time + 0.10);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(Math.min(0.4, volume), time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(time);
      osc.stop(time + 0.16);
    },
    stop() { if (ctx.state !== "closed") void ctx.close(); },
  };
}
