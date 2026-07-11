import type { GroupMemberStatus, ParBucket, RepaymentFrequency } from "./types";

/** Flat-rate loan pricing: total repayable is principal plus a flat monthly rate applied across the tenor. */
export function totalRepayable(principal: number, monthlyFlatRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  return principal * (1 + monthlyFlatRate * months);
}

/** Number of repayment installments across the tenor for a given collection frequency. */
export function numPeriods(months: number, frequency: RepaymentFrequency): number {
  if (months <= 0) return 0;
  switch (frequency) {
    case "daily":
      return Math.round(months * 30);
    case "weekly":
      return Math.round(months * (52 / 12));
    case "monthly":
      return Math.round(months);
  }
}

export function installment(
  principal: number,
  monthlyFlatRate: number,
  months: number,
  frequency: RepaymentFrequency
): number {
  const periods = numPeriods(months, frequency);
  if (periods <= 0) return 0;
  return totalRepayable(principal, monthlyFlatRate, months) / periods;
}

export function processingFee(principal: number): number {
  if (principal <= 0) return 0;
  return principal * 0.02;
}

/** Penalty is capped at 10% of the installment so a very large arrears balance can't spiral. */
export function penalty(overdueAmount: number, daysLate: number, installmentAmount: number): number {
  if (overdueAmount <= 0 || daysLate <= 0) return 0;
  return Math.min(overdueAmount * 0.005 * daysLate, installmentAmount * 0.1);
}

/** A first loan is capped at 2x the client's average monthly savings/susu inflow over the last 3 months. */
export function eligibilityLimit(avgMonthlySavingsInflow: number): number {
  if (avgMonthlySavingsInflow <= 0) return 0;
  return 2 * avgMonthlySavingsInflow;
}

export function parBucket(daysPastDue: number): ParBucket {
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "1-30";
  if (daysPastDue <= 90) return "31-90";
  return "90+";
}

export const CGAP_PROVISION_RATES: Record<ParBucket, number> = {
  current: 0.01,
  "1-30": 0.1,
  "31-90": 0.5,
  "90+": 1.0,
};

export const WRITE_OFF_DAYS_PAST_DUE = 180;

export function provision(outstanding: number, daysPastDue: number): number {
  if (outstanding <= 0) return 0;
  return outstanding * CGAP_PROVISION_RATES[parBucket(daysPastDue)];
}

export function isWriteOffCandidate(daysPastDue: number): boolean {
  return daysPastDue >= WRITE_OFF_DAYS_PAST_DUE;
}

/**
 * Grameen-style group lending: 5 members, disbursed in staggered tranches of 2-2-1.
 * The next tranche only unlocks once every member disbursed so far is current (not overdue/defaulted).
 */
export const GROUP_SIZE = 5;
export const GROUP_TRANCHES: readonly number[] = [2, 2, 1];

export interface GroupDisbursementResult {
  /** Index into GROUP_TRANCHES for the tranche currently being disbursed, or null if the group is fully disbursed. */
  activeTrancheIndex: number | null;
  /** How many members in the active tranche are still awaiting disbursement. */
  pendingInActiveTranche: number;
  /** True if disbursement of the active tranche is blocked by an earlier delinquent member. */
  blocked: boolean;
  reason?: string;
}

export function groupDisbursementGate(memberStatuses: GroupMemberStatus[]): GroupDisbursementResult {
  if (memberStatuses.length !== GROUP_SIZE) {
    throw new Error(`Grameen groups require exactly ${GROUP_SIZE} members, got ${memberStatuses.length}`);
  }

  let cursor = 0;
  for (let trancheIndex = 0; trancheIndex < GROUP_TRANCHES.length; trancheIndex++) {
    const size = GROUP_TRANCHES[trancheIndex];
    const tranche = memberStatuses.slice(cursor, cursor + size);
    const pending = tranche.filter((s) => s === "pending").length;

    if (pending > 0) {
      const earlierDelinquent = memberStatuses
        .slice(0, cursor)
        .some((s) => s === "overdue" || s === "defaulted");
      return {
        activeTrancheIndex: trancheIndex,
        pendingInActiveTranche: pending,
        blocked: earlierDelinquent,
        reason: earlierDelinquent
          ? "An earlier tranche has a member overdue or defaulted"
          : undefined,
      };
    }

    const delinquentInTranche = tranche.some((s) => s === "overdue" || s === "defaulted");
    if (delinquentInTranche) {
      const nextIndex = trancheIndex + 1 < GROUP_TRANCHES.length ? trancheIndex + 1 : null;
      return {
        activeTrancheIndex: nextIndex,
        pendingInActiveTranche: 0,
        blocked: true,
        reason: `Tranche ${trancheIndex + 1} has a member overdue or defaulted`,
      };
    }

    cursor += size;
  }

  return { activeTrancheIndex: null, pendingInActiveTranche: 0, blocked: false, reason: "All tranches disbursed" };
}
