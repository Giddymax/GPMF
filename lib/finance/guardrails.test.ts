import { describe, expect, it } from "vitest";
import {
  canDisburse,
  checkLiquidityReserve,
  checkLoanToDeposit,
  checkSingleBorrowerExposure,
} from "./guardrails";

describe("guardrails", () => {
  it("passes the liquidity reserve check at exactly 30%", () => {
    expect(checkLiquidityReserve(300, 1000).ok).toBe(true);
  });

  it("fails the liquidity reserve check below 30%", () => {
    const result = checkLiquidityReserve(200, 1000);
    expect(result.ok).toBe(false);
    expect(result.value).toBeCloseTo(0.2);
  });

  it("treats a zero deposit base as not computable rather than crashing", () => {
    const result = checkLiquidityReserve(0, 0);
    expect(result.value).toBeNull();
  });

  it("fails the loan-to-deposit check above 60%", () => {
    expect(checkLoanToDeposit(700, 1000).ok).toBe(false);
    expect(checkLoanToDeposit(600, 1000).ok).toBe(true);
  });

  it("fails single-borrower exposure above 5% of the portfolio", () => {
    expect(checkSingleBorrowerExposure(60, 1000).ok).toBe(false);
    expect(checkSingleBorrowerExposure(50, 1000).ok).toBe(true);
  });

  it("blocks a disbursement that would breach the liquidity reserve", () => {
    const result = canDisburse(500, 350, 400, 1000);
    expect(result.ok).toBe(false);
  });

  it("allows a disbursement that keeps both guardrails within limits", () => {
    const result = canDisburse(50, 500, 400, 1000);
    expect(result.ok).toBe(true);
  });
});
