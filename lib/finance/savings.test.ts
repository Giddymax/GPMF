import { describe, expect, it } from "vitest";
import { accrueDailyInterest, daysInMonth, monthlyInterest, withdrawalFee } from "./savings";

describe("savings", () => {
  it("computes monthly interest as avg daily balance times annual rate over 12", () => {
    expect(monthlyInterest(1000, 0.06)).toBeCloseTo((1000 * 0.06) / 12);
  });

  it("returns zero interest for a zero or negative balance", () => {
    expect(monthlyInterest(0, 0.06)).toBe(0);
    expect(monthlyInterest(-50, 0.06)).toBe(0);
  });

  describe("leap-year accrual", () => {
    it("2028 February has 29 days and accrues proportionally more than a 28-day February", () => {
      const leapDays = daysInMonth(2028, 2);
      const nonLeapDays = daysInMonth(2029, 2);
      expect(leapDays).toBe(29);
      expect(nonLeapDays).toBe(28);

      const leapAccrual = accrueDailyInterest(1000, 0.06, leapDays);
      const nonLeapAccrual = accrueDailyInterest(1000, 0.06, nonLeapDays);
      expect(leapAccrual).toBeGreaterThan(nonLeapAccrual);
      expect(leapAccrual).toBeCloseTo((1000 * 0.06 * 29) / 365);
    });

    it("keeps a fixed /365 divisor regardless of leap year (actual/365 convention)", () => {
      const accrual = accrueDailyInterest(1000, 0.06, 366);
      expect(accrual).toBeCloseTo((1000 * 0.06 * 366) / 365);
    });
  });

  it("charges the greater of the flat fee or the percentage fee on withdrawal", () => {
    expect(withdrawalFee(10, 2, 0.5)).toBe(5); // pct fee (5) beats flat fee (2)
    expect(withdrawalFee(1, 2, 0.5)).toBe(2); // flat fee (2) beats pct fee (0.5)
  });

  it("charges nothing on a zero withdrawal", () => {
    expect(withdrawalFee(0, 2, 0.5)).toBe(0);
  });
});
