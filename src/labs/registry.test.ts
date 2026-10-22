import { describe, expect, it } from "vitest";
import { labs } from "./registry";

describe("lab registry", () => {
  it("keeps future labs from looking finished", () => {
    const soon = labs.filter((lab) => lab.status === "soon").map((lab) => lab.id);
    expect(soon).toEqual(["gene", "space", "muscle"]);
    for (const lab of labs.filter((item) => item.status === "soon")) {
      expect(lab.experiments).toEqual([]);
    }
  });

  it("registers the four working labs with lesson routes", () => {
    const ready = labs.filter((lab) => lab.status === "ready").map((lab) => lab.id);
    expect(ready).toEqual(["brain", "heart", "earth", "physics"]);
  });
});
