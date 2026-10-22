import { describe, expect, it } from "vitest";
import { actionApps } from "./apps";
import { demoSteps } from "./demoScript";

describe("guided demo script", () => {
  it("walks problem, EEG, ECG, action, headset, then future labs", () => {
    const steps = demoSteps(false);
    expect(steps.map((step) => step.part)).toEqual(["1", "2", "2", "3", "3", "4", "5", "6"]);
    expect(steps.map((step) => step.id)).toEqual([
      "problem",
      "brain",
      "alpha",
      "heart",
      "rate",
      "action",
      "openbci",
      "future",
    ]);
  });

  it("uses the manual board when no verified blink file is bundled", () => {
    const action = demoSteps(false).find((step) => step.id === "action");
    expect(action?.drive).toBe("manual-scan");
    const withFile = demoSteps(true).find((step) => step.id === "action");
    expect(withFile?.drive).toBe("recorded-events");
  });

  it("does not start a live stream from the tour", () => {
    expect(demoSteps(false).some((step) => step.drive === "recorded-events")).toBe(false);
    expect(demoSteps(false).map((step) => step.drive)).not.toContain("live");
  });
});

describe("science in action registry", () => {
  it("ships only Blink-to-Select and leaves the other ideas unfinished", () => {
    const ready = actionApps.filter((app) => app.status === "ready").map((app) => app.id);
    expect(ready).toEqual(["blink"]);
    for (const app of actionApps.filter((item) => item.status === "soon")) {
      expect(app.href).toBe("");
      expect(app.later.toLowerCase()).toMatch(/not built/);
    }
  });
});
