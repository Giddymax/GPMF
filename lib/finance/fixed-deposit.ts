/** Fixed deposits: simple interest priced off tenor; early termination recalculated at the savings rate. */
export function maturityValue(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return principal;
  return principal * (1 + (annualRate * months) / 12);
}

export function fdInterestEarned(principal: number, annualRate: number, months: number): number {
  return maturityValue(principal, annualRate, months) - principal;
}

/**
 * Early termination pays the savings rate for the days actually held, never more than
 * the deposit would have earned by running to full maturity at the contracted FD rate.
 */
export function earlyTerminationValue(
  principal: number,
  savingsAnnualRate: number,
  daysElapsed: number,
  contractedAnnualRate: number,
  contractedMonths: number
): number {
  if (principal <= 0 || daysElapsed <= 0) return principal;
  const accrued = principal * (1 + (savingsAnnualRate * daysElapsed) / 365);
  const fullTermValue = maturityValue(principal, contractedAnnualRate, contractedMonths);
  return Math.min(accrued, fullTermValue);
}
