import { describe, expect, it } from "vitest";
import { switchInputMode } from "./modes";

describe("input modes", () => {
  it("does not enter recorded mode when no file has been accepted", () => {
    const next = switchInputMode("manual", "recorded", false);
    expect(next.mode).toBe("manual");
    expect(next.resetClock).toBe(false);
    expect(next.notice).toMatch(/stays off/);
  });

  it("resets the clock when the mode actually changes", () => {
    expect(switchInputMode("manual", "live", false).resetClock).toBe(true);
    expect(switchInputMode("manual", "recorded", true)).toMatchObject({ mode: "recorded", resetClock: true });
    expect(switchInputMode("live", "manual", false)).toMatchObject({ mode: "manual", resetClock: true });
  });

  it("leaves the clock alone when the requested mode is already active", () => {
    expect(switchInputMode("manual", "manual", false)).toEqual({
      mode: "manual",
      notice: null,
      resetClock: false,
    });
  });
});
