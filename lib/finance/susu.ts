/**
 * Daily susu: fixed daily contribution over a 31-day cycle.
 * Commission is one day's contribution per month; pro-rated down if the
 * client paid in on fewer than half the cycle's days (sparse collection).
 */
export const SUSU_CYCLE_DAYS = 31;
export const SUSU_SPARSE_THRESHOLD_DAYS = 15;

export function cycleCommission(daily: number, daysPaid: number): number {
  if (daily <= 0 || daysPaid <= 0) return 0;
  const cappedDays = Math.min(daysPaid, SUSU_CYCLE_DAYS);
  return cappedDays >= SUSU_SPARSE_THRESHOLD_DAYS ? daily : daily * 0.5;
}

export function cyclePayout(daily: number, daysPaid: number): number {
  if (daily <= 0 || daysPaid <= 0) return 0;
  const cappedDays = Math.min(daysPaid, SUSU_CYCLE_DAYS);
  const commission = cycleCommission(daily, cappedDays);
  return Math.max(daily * cappedDays - commission, 0);
}

export interface SusuCycleSummary {
  daily: number;
  daysPaid: number;
  missedDays: number;
  commission: number;
  payout: number;
}

export function summarizeCycle(daily: number, daysPaid: number): SusuCycleSummary {
  const cappedDays = Math.max(0, Math.min(daysPaid, SUSU_CYCLE_DAYS));
  return {
    daily,
    daysPaid: cappedDays,
    missedDays: SUSU_CYCLE_DAYS - cappedDays,
    commission: cycleCommission(daily, cappedDays),
    payout: cyclePayout(daily, cappedDays),
  };
}
