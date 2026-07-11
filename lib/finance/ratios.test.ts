import { describe, expect, it } from "vitest";
import {
  almGap,
  breakEvenPortfolio,
  costPerBorrower,
  fss,
  liquidityRatio,
  loanToDepositRatio,
  monthlyNetIncome,
  operatingExpenseRatio,
  oss,
  par30,
  portfolioYield,
  riskCoverageRatio,
  roa,
  roe,
  writeOffRatio,
} from "./ratios";

describe("SEEP/CGAP institutional ratios", () => {
  it("computes OSS as financial revenue over total costs", () => {
    expect(oss(1200, 400, 200, 400)).toBeCloseTo(1.2);
  });

  it("computes FSS against adjusted expenses", () => {
    expect(fss(1200, 1000)).toBeCloseTo(1.2);
  });

  it("computes ROA and ROE against average assets/equity", () => {
    expect(roa(200, 10000)).toBeCloseTo(0.02);
    expect(roe(200, 1000)).toBeCloseTo(0.2);
  });

  it("computes portfolio yield and PAR30", () => {
    expect(portfolioYield(600, 5000)).toBeCloseTo(0.12);
    expect(par30(250, 5000)).toBeCloseTo(0.05);
  });

  it("computes write-off ratio and risk coverage", () => {
    expect(writeOffRatio(100, 5000)).toBeCloseTo(0.02);
    expect(riskCoverageRatio(300, 250)).toBeCloseTo(1.2);
  });

  it("computes operating expense ratio and cost per borrower", () => {
    expect(operatingExpenseRatio(1000, 5000)).toBeCloseTo(0.2);
    expect(costPerBorrower(1000, 200)).toBeCloseTo(5);
  });

  it("computes liquidity and loan-to-deposit ratios", () => {
    expect(liquidityRatio(3000, 10000)).toBeCloseTo(0.3);
    expect(loanToDepositRatio(6000, 10000)).toBeCloseTo(0.6);
  });

  it("computes the ALM gap as assets maturing minus liabilities maturing", () => {
    expect(almGap(5000, 4200)).toBe(800);
    expect(almGap(3000, 4200)).toBe(-1200);
  });

  it("computes monthly net income across all revenue and expense lines", () => {
    const income = monthlyNetIncome({
      susuCommission: 500,
      loanInterest: 2000,
      fees: 100,
      treasuryIncome: 150,
      savingsInterest: 300,
      fdInterest: 400,
      agentCommission: 200,
      opex: 1000,
    });
    expect(income).toBe(500 + 2000 + 100 + 150 - (300 + 400 + 200 + 1000));
  });

  describe("division-by-zero guards", () => {
    it("returns null rather than NaN/Infinity for every ratio when the denominator is zero", () => {
      expect(oss(1000, 0, 0, 0)).toBeNull();
      expect(fss(1000, 0)).toBeNull();
      expect(roa(1000, 0)).toBeNull();
      expect(roe(1000, 0)).toBeNull();
      expect(portfolioYield(1000, 0)).toBeNull();
      expect(par30(1000, 0)).toBeNull();
      expect(writeOffRatio(1000, 0)).toBeNull();
      expect(riskCoverageRatio(1000, 0)).toBeNull();
      expect(operatingExpenseRatio(1000, 0)).toBeNull();
      expect(costPerBorrower(1000, 0)).toBeNull();
      expect(liquidityRatio(1000, 0)).toBeNull();
      expect(loanToDepositRatio(1000, 0)).toBeNull();
    });
  });

  describe("break-even portfolio", () => {
    it("computes the portfolio size that covers fixed costs at the given spread", () => {
      // yield 25% - funding cost 5% - loss rate 2% = 18% spread
      expect(breakEvenPortfolio(1800, 0.25, 0.05, 0.02)).toBeCloseTo(10000);
    });

    it("returns null when pricing can never cover funding cost + loss rate", () => {
      expect(breakEvenPortfolio(1800, 0.05, 0.05, 0.02)).toBeNull();
    });
  });
});
