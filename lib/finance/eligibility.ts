import { eligibilityLimit } from "./loans";

export interface IndividualLoanEligibilityInput {
  completedSusuCycles: number;
  monthsOfSavingsHistory: number;
  avgMonthlySavingsInflow: number;
  requestedPrincipal: number;
}

export interface EligibilityResult {
  eligible: boolean;
  maxPrincipal: number;
  reason?: string;
}

/** ASA-style individual lending: your own savings/susu record is your credit score. */
export function isEligibleForIndividualLoan(
  input: IndividualLoanEligibilityInput
): EligibilityResult {
  const maxPrincipal = eligibilityLimit(input.avgMonthlySavingsInflow);
  const hasTrackRecord =
    input.completedSusuCycles >= 2 || input.monthsOfSavingsHistory >= 3;

  if (!hasTrackRecord) {
    return {
      eligible: false,
      maxPrincipal,
      reason: "Needs at least 2 completed susu cycles or 3 months of savings history",
    };
  }

  if (input.requestedPrincipal <= 0) {
    return { eligible: false, maxPrincipal, reason: "Requested amount must be greater than zero" };
  }

  if (input.requestedPrincipal > maxPrincipal) {
    return {
      eligible: false,
      maxPrincipal,
      reason: `Requested amount exceeds the 2x average monthly savings inflow cap of ${maxPrincipal.toFixed(2)}`,
    };
  }

  return { eligible: true, maxPrincipal };
}

/** Grameen-style group lending: eligibility rests on the group's compulsory savings collateral, not individual history. */
export function isEligibleForGroupLoan(
  requestedPrincipal: number,
  groupCollateralBalance: number
): EligibilityResult {
  const requiredCollateral = requestedPrincipal * 0.1;
  if (groupCollateralBalance < requiredCollateral) {
    return {
      eligible: false,
      maxPrincipal: groupCollateralBalance / 0.1,
      reason: `Group collateral (10% of loan) must be at least ${requiredCollateral.toFixed(2)}`,
    };
  }
  return { eligible: true, maxPrincipal: groupCollateralBalance / 0.1 };
}
