import { describe, expect, it } from "vitest";
import { SCAN_OPTIONS, activateSelection, highlightIndex, optionAt } from "./scanner";

describe("scanning board", () => {
  it("steps through the four choices and wraps", () => {
    expect(optionAt(0, 1000)).toBe("Water");
    expect(optionAt(1000, 1000)).toBe("Help");
    expect(optionAt(2000, 1000)).toBe("Yes");
    expect(optionAt(3000, 1000)).toBe("No");
    expect(optionAt(4000, 1000)).toBe("Water");
    expect(highlightIndex(2500, SCAN_OPTIONS.length, 1000)).toBe(2);
  });

  it("rejects a dwell of zero", () => {
    expect(() => highlightIndex(0, 4, 0)).toThrow(/Dwell/);
  });

  it("activates whichever choice is highlighted", () => {
    const picked = activateSelection(3000, 1000, "manual");
    expect(picked).toEqual({ option: "No", elapsedMs: 3000, source: "manual" });
  });
});
