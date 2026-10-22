import { afterEach, describe, expect, it, vi } from "vitest";
import { startHeartAudio, startTone } from "./tones";

function fakeAudio(initialState = "suspended") {
  const param = () => ({ value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
  const oscillator = { type: "", frequency: param(), connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
  const gain = { gain: param(), connect: vi.fn(), disconnect: vi.fn() };
  const ctx = { state: initialState, currentTime: 0, destination: {}, resume: vi.fn(async () => { ctx.state = "running"; }), close: vi.fn(async () => {ctx.state = "closed";}), createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain) };
  vi.stubGlobal("window", { AudioContext: class { constructor() { return ctx; } } });
  return { ctx, oscillator, gain };
}
afterEach(() => vi.unstubAllGlobals());
describe("audio activation and cleanup", () => {
  it("resumes a suspended engine before starting a tone", async () => {
    const {ctx,oscillator,gain}=fakeAudio();
    const tone=await startTone(0.12);
    expect(ctx.resume).toHaveBeenCalledOnce();
    expect(ctx.state).toBe("running");
    expect(oscillator.start).toHaveBeenCalledOnce();
    expect(gain.gain.value).toBe(0.12);
    tone.setVolume(0);
    expect(gain.gain.setTargetAtTime).toHaveBeenCalledWith(0,0,0.05);
    tone.stop();tone.stop();
    expect(oscillator.stop).toHaveBeenCalledOnce();
    expect(ctx.close).toHaveBeenCalledOnce();
  });
  it("reports blocked audio and closes the unused engine", async () => {
    const {ctx,oscillator}=fakeAudio();
    ctx.resume.mockImplementation(async () => {});
    await expect(startTone(0.1)).rejects.toThrow("Audio is blocked");
    expect(oscillator.start).not.toHaveBeenCalled();
    expect(ctx.close).toHaveBeenCalledOnce();
  });
  it("reports unsupported browsers", async () => {
    vi.stubGlobal("window", {});
    await expect(startTone(0.1)).rejects.toThrow("does not support audio");
  });
  it("unlocks heart audio before pulses and respects zero volume", async () => {
    const {ctx,oscillator}=fakeAudio();
    const audio=await startHeartAudio();
    expect(ctx.resume).toHaveBeenCalledOnce();
    expect(oscillator.start).not.toHaveBeenCalled();
    audio.thump(0);
    expect(oscillator.start).not.toHaveBeenCalled();
    audio.thump(0.2);
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440,0);
    expect(oscillator.start).toHaveBeenCalledWith(0);
    audio.stop();audio.stop();
    expect(ctx.close).toHaveBeenCalledOnce();
  });
});
