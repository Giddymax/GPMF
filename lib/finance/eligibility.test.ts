import { describe, expect, it } from "vitest";
import { isEligibleForGroupLoan, isEligibleForIndividualLoan } from "./eligibility";

describe("individual loan eligibility (ASA model)", () => {
  it("approves a client with 2+ susu cycles within the 2x savings cap", () => {
    const result = isEligibleForIndividualLoan({
      completedSusuCycles: 2,
      monthsOfSavingsHistory: 0,
      avgMonthlySavingsInflow: 300,
      requestedPrincipal: 500,
    });
    expect(result.eligible).toBe(true);
    expect(result.maxPrincipal).toBe(600);
  });

  it("approves via 3 months of savings history even with fewer than 2 susu cycles", () => {
    const result = isEligibleForIndividualLoan({
      completedSusuCycles: 0,
      monthsOfSavingsHistory: 3,
      avgMonthlySavingsInflow: 200,
      requestedPrincipal: 100,
    });
    expect(result.eligible).toBe(true);
  });

  it("rejects a client with no track record", () => {
    const result = isEligibleForIndividualLoan({
      completedSusuCycles: 1,
      monthsOfSavingsHistory: 1,
      avgMonthlySavingsInflow: 300,
      requestedPrincipal: 100,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/susu cycles|savings history/);
  });

  it("rejects a request above the 2x average monthly savings cap", () => {
    const result = isEligibleForIndividualLoan({
      completedSusuCycles: 4,
      monthsOfSavingsHistory: 4,
      avgMonthlySavingsInflow: 300,
      requestedPrincipal: 700,
    });
    expect(result.eligible).toBe(false);
    expect(result.maxPrincipal).toBe(600);
  });
});

describe("group loan eligibility (Grameen model)", () => {
  it("approves when the group's collateral covers 10% of the requested principal", () => {
    const result = isEligibleForGroupLoan(1000, 100);
    expect(result.eligible).toBe(true);
  });

  it("rejects when the group collateral is short of 10%", () => {
    const result = isEligibleForGroupLoan(1000, 50);
    expect(result.eligible).toBe(false);
  });
});
