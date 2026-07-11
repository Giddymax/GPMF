import { describe, expect, it } from "vitest";
import { earlyTerminationValue, fdInterestEarned, maturityValue } from "./fixed-deposit";

describe("fixed deposit", () => {
  it("computes simple interest maturity value for a 12-month term", () => {
    expect(maturityValue(1000, 0.12, 12)).toBeCloseTo(1120);
  });

  it("computes simple interest maturity value for a partial-year term", () => {
    expect(maturityValue(1000, 0.12, 6)).toBeCloseTo(1060);
  });

  it("returns the principal untouched for a zero-month term", () => {
    expect(maturityValue(1000, 0.12, 0)).toBe(1000);
  });

  it("computes interest earned as the delta over principal", () => {
    expect(fdInterestEarned(1000, 0.12, 12)).toBeCloseTo(120);
  });

  describe("early termination", () => {
    it("recalculates at the savings rate for the days actually held", () => {
      const value = earlyTerminationValue(1000, 0.05, 90, 0.12, 12);
      expect(value).toBeCloseTo(1000 * (1 + (0.05 * 90) / 365));
    });

    it("never pays more than running the deposit to full contracted maturity", () => {
      // Savings rate accrual over the full term would exceed the FD's own contracted maturity value.
      const value = earlyTerminationValue(1000, 0.5, 365, 0.05, 12);
      expect(value).toBeCloseTo(maturityValue(1000, 0.05, 12));
    });

    it("returns the principal for a same-day termination", () => {
      expect(earlyTerminationValue(1000, 0.05, 0, 0.12, 12)).toBe(1000);
    });
  });
});
