import { describe, expect, it } from "vitest";
import {
  CGAP_PROVISION_RATES,
  eligibilityLimit,
  groupDisbursementGate,
  installment,
  isWriteOffCandidate,
  numPeriods,
  parBucket,
  penalty,
  processingFee,
  provision,
  totalRepayable,
} from "./loans";

describe("loan pricing", () => {
  it("computes total repayable at a flat monthly rate over the tenor", () => {
    expect(totalRepayable(1000, 0.05, 3)).toBeCloseTo(1150);
  });

  it("computes installments for daily, weekly and monthly frequencies", () => {
    expect(numPeriods(1, "monthly")).toBe(1);
    expect(numPeriods(1, "weekly")).toBe(4);
    expect(numPeriods(1, "daily")).toBe(30);
    expect(installment(1000, 0.05, 1, "monthly")).toBeCloseTo(1050);
  });

  it("charges a 2% processing fee", () => {
    expect(processingFee(1000)).toBe(20);
    expect(processingFee(0)).toBe(0);
  });

  describe("partial repayments / penalties", () => {
    it("charges 0.5% of the overdue balance per day late, capped at 10% of the installment", () => {
      expect(penalty(100, 5, 1000)).toBeCloseTo(2.5); // 100*0.005*5 = 2.5, well under the 10% cap
    });

    it("caps the penalty at 10% of the installment even for large overdue balances", () => {
      expect(penalty(10000, 60, 100)).toBe(10); // 10000*0.005*60=3000, capped to 100*0.10=10
    });

    it("charges nothing when there is no overdue balance", () => {
      expect(penalty(0, 10, 100)).toBe(0);
      expect(penalty(500, 0, 100)).toBe(0);
    });
  });

  it("caps eligibility at 2x average monthly savings inflow", () => {
    expect(eligibilityLimit(400)).toBe(800);
    expect(eligibilityLimit(0)).toBe(0);
    expect(eligibilityLimit(-10)).toBe(0);
  });
});

describe("PAR bucketing and provisioning", () => {
  it("buckets days past due per the CGAP ladder", () => {
    expect(parBucket(0)).toBe("current");
    expect(parBucket(15)).toBe("1-30");
    expect(parBucket(45)).toBe("31-90");
    expect(parBucket(120)).toBe("90+");
  });

  it("applies the CGAP-style provisioning rate for each bucket", () => {
    expect(provision(1000, 0)).toBeCloseTo(1000 * CGAP_PROVISION_RATES.current);
    expect(provision(1000, 45)).toBeCloseTo(1000 * CGAP_PROVISION_RATES["31-90"]);
    expect(provision(1000, 200)).toBeCloseTo(1000 * CGAP_PROVISION_RATES["90+"]);
  });

  it("flags loans past 180 days as write-off candidates", () => {
    expect(isWriteOffCandidate(179)).toBe(false);
    expect(isWriteOffCandidate(180)).toBe(true);
  });
});

describe("group-gate blocking (2-2-1 disbursement)", () => {
  it("unlocks the first tranche of 2 when all 5 members are pending", () => {
    const result = groupDisbursementGate(["pending", "pending", "pending", "pending", "pending"]);
    expect(result.activeTrancheIndex).toBe(0);
    expect(result.pendingInActiveTranche).toBe(2);
    expect(result.blocked).toBe(false);
  });

  it("unlocks the second tranche once the first tranche's 2 members are current", () => {
    const result = groupDisbursementGate(["current", "current", "pending", "pending", "pending"]);
    expect(result.activeTrancheIndex).toBe(1);
    expect(result.blocked).toBe(false);
  });

  it("blocks the second tranche if a first-tranche member is overdue", () => {
    const result = groupDisbursementGate(["current", "overdue", "pending", "pending", "pending"]);
    expect(result.activeTrancheIndex).toBe(1);
    expect(result.blocked).toBe(true);
    expect(result.reason).toMatch(/overdue/);
  });

  it("unlocks the final tranche of 1 once both prior tranches are current", () => {
    const result = groupDisbursementGate(["current", "current", "current", "current", "pending"]);
    expect(result.activeTrancheIndex).toBe(2);
    expect(result.pendingInActiveTranche).toBe(1);
    expect(result.blocked).toBe(false);
  });

  it("reports no active tranche once the whole group is disbursed", () => {
    const result = groupDisbursementGate(["current", "current", "current", "current", "current"]);
    expect(result.activeTrancheIndex).toBeNull();
    expect(result.blocked).toBe(false);
  });

  it("throws for a group that is not exactly 5 members", () => {
    expect(() => groupDisbursementGate(["pending", "pending"])).toThrow();
  });
});
