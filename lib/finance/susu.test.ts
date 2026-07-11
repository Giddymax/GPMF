import { describe, expect, it } from "vitest";
import { cycleCommission, cyclePayout, summarizeCycle, SUSU_CYCLE_DAYS } from "./susu";

describe("susu", () => {
  it("pays out 30 days of contribution after a full 31-day cycle (1 day commission)", () => {
    expect(cyclePayout(10, 31)).toBeCloseTo(300);
    expect(cycleCommission(10, 31)).toBeCloseTo(10);
  });

  it("charges full commission once at least 15 days were paid", () => {
    expect(cycleCommission(5, 15)).toBe(5);
    expect(cyclePayout(5, 15)).toBeCloseTo(5 * 15 - 5);
  });

  it("halves the commission for sparse collection under 15 days", () => {
    expect(cycleCommission(5, 10)).toBe(2.5);
    expect(cyclePayout(5, 10)).toBeCloseTo(5 * 10 - 2.5);
  });

  it("never pays out a negative amount when almost no days were paid", () => {
    expect(cyclePayout(5, 1)).toBeGreaterThanOrEqual(0);
    expect(cyclePayout(5, 0)).toBe(0);
  });

  it("treats zero or negative days paid as a missed cycle", () => {
    expect(cyclePayout(5, -3)).toBe(0);
    expect(cycleCommission(5, -3)).toBe(0);
  });

  it("caps days paid at the 31-day cycle length even if more collections are recorded", () => {
    expect(cyclePayout(10, 40)).toBe(cyclePayout(10, SUSU_CYCLE_DAYS));
  });

  it("summarizeCycle reports missed days against the 31-day cycle", () => {
    const summary = summarizeCycle(5, 20);
    expect(summary.missedDays).toBe(11);
    expect(summary.daysPaid).toBe(20);
    expect(summary.commission).toBe(5);
  });
});
