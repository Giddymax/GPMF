/** Savings accounts: monthly-posted interest on average daily balance, actual/365 day-count convention. */
const DAY_COUNT_BASIS = 365;

export function monthlyInterest(avgDailyBalance: number, annualRate: number): number {
  if (avgDailyBalance <= 0 || annualRate <= 0) return 0;
  return (avgDailyBalance * annualRate) / 12;
}

/**
 * Actual/365 daily accrual for a given number of calendar days in the period.
 * The denominator stays fixed at 365 even in leap years (actual/365 fixed convention),
 * so a 29-day February accrues proportionally more than a 28-day one without changing the divisor.
 */
export function accrueDailyInterest(
  avgDailyBalance: number,
  annualRate: number,
  daysInPeriod: number
): number {
  if (avgDailyBalance <= 0 || annualRate <= 0 || daysInPeriod <= 0) return 0;
  return (avgDailyBalance * annualRate * daysInPeriod) / DAY_COUNT_BASIS;
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

export function withdrawalFee(amount: number, flatFee: number, feePct: number): number {
  if (amount <= 0) return 0;
  return Math.max(flatFee, amount * feePct);
}
