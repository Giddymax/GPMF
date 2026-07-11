import { safeDiv } from "./safe-math";

/**
 * SEEP Network / CGAP-MIX standard institutional ratios. Every function returns
 * `null` instead of NaN/Infinity when a denominator is zero, so dashboards can
 * render "—" for a brand-new institution instead of crashing.
 */

export const RATIO_BENCHMARKS = {
  oss: 1.2, // Operational Self-Sufficiency target > 120%
  ossBreakEven: 1.0,
  fss: 1.0, // Financial Self-Sufficiency target > 100%
  roa: 0.02, // > 2%
  roe: 0.15, // > 15%
  par30Alert: 0.05, // alert if > 5%
  writeOffAlert: 0.02, // alert if > 2%
  riskCoverage: 1.0, // target > 100%
  operatingExpenseRatioAlert: 0.2, // alert if > 20%
  liquidityAlert: 0.3, // alert if < 30%
  loanToDepositAlert: 0.6, // alert if > 60%
} as const;

export function oss(
  financialRevenue: number,
  financialExpense: number,
  loanLossProvisionExpense: number,
  operatingExpense: number
): number | null {
  return safeDiv(financialRevenue, financialExpense + loanLossProvisionExpense + operatingExpense);
}

export function fss(financialRevenue: number, adjustedExpenses: number): number | null {
  return safeDiv(financialRevenue, adjustedExpenses);
}

export function roa(netOperatingIncome: number, averageTotalAssets: number): number | null {
  return safeDiv(netOperatingIncome, averageTotalAssets);
}

export function roe(netOperatingIncome: number, averageEquity: number): number | null {
  return safeDiv(netOperatingIncome, averageEquity);
}

export function portfolioYield(
  interestAndFeesFromLoans: number,
  averageGrossLoanPortfolio: number
): number | null {
  return safeDiv(interestAndFeesFromLoans, averageGrossLoanPortfolio);
}

export function par30(
  outstandingBalanceLoans30dLate: number,
  grossLoanPortfolio: number
): number | null {
  return safeDiv(outstandingBalanceLoans30dLate, grossLoanPortfolio);
}

export function writeOffRatio(
  writtenOff: number,
  averageGrossLoanPortfolio: number
): number | null {
  return safeDiv(writtenOff, averageGrossLoanPortfolio);
}

export function riskCoverageRatio(
  loanLossReserve: number,
  par30Outstanding: number
): number | null {
  return safeDiv(loanLossReserve, par30Outstanding);
}

export function operatingExpenseRatio(
  operatingExpense: number,
  averageGrossLoanPortfolio: number
): number | null {
  return safeDiv(operatingExpense, averageGrossLoanPortfolio);
}

export function costPerBorrower(
  operatingExpense: number,
  averageActiveBorrowers: number
): number | null {
  return safeDiv(operatingExpense, averageActiveBorrowers);
}

export function borrowersPerStaff(activeBorrowers: number, staffCount: number): number | null {
  return safeDiv(activeBorrowers, staffCount);
}

export function liquidityRatio(
  liquidAssets: number,
  totalDepositLiabilities: number
): number | null {
  return safeDiv(liquidAssets, totalDepositLiabilities);
}

export function loanToDepositRatio(
  grossLoanPortfolio: number,
  totalDeposits: number
): number | null {
  return safeDiv(grossLoanPortfolio, totalDeposits);
}

export type AlmBucket = "0-30" | "31-90" | "91-180" | "180+";

export function almGap(assetsMaturing: number, liabilitiesMaturing: number): number {
  return assetsMaturing - liabilitiesMaturing;
}

export interface MonthlyIncomeInputs {
  susuCommission: number;
  loanInterest: number;
  fees: number;
  treasuryIncome: number;
  savingsInterest: number;
  fdInterest: number;
  agentCommission: number;
  opex: number;
}

export function monthlyNetIncome(inputs: MonthlyIncomeInputs): number {
  const revenue =
    inputs.susuCommission + inputs.loanInterest + inputs.fees + inputs.treasuryIncome;
  const expense =
    inputs.savingsInterest + inputs.fdInterest + inputs.agentCommission + inputs.opex;
  return revenue - expense;
}

/**
 * Portfolio size at which financial revenue exactly covers costs.
 * Returns null when the pricing itself can never cover funding + loss costs
 * (portfolio yield <= funding cost + loss rate), since growing the book wouldn't help.
 */
export function breakEvenPortfolio(
  fixedCosts: number,
  portfolioYieldRate: number,
  fundingCostRate: number,
  lossRate: number
): number | null {
  const denominator = portfolioYieldRate - fundingCostRate - lossRate;
  if (denominator <= 0) return null;
  return fixedCosts / denominator;
}
