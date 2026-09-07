import { describe, expect, it } from "vitest";
import { calculateLoadProfitability } from "../lib/types";

describe("calculateLoadProfitability", () => {
  it("matches the worked example in docs/PROJECT_PLAN.md (section 11)", () => {
    const result = calculateLoadProfitability({
      rate: 2400,
      loadedMiles: 720,
      deadheadMiles: 80,
    });

    expect(result.totalMiles).toBe(800);
    expect(result.loadedRatePerMile).toBeCloseTo(3.33, 2);
    expect(result.effectiveRatePerMile).toBeCloseTo(3.0, 2);
  });
});
