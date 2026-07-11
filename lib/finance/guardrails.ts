import { safeDiv } from "./safe-math";

export const LIQUIDITY_RESERVE_MIN = 0.3;
export const LOAN_TO_DEPOSIT_MAX = 0.6;
export const SINGLE_BORROWER_MAX_SHARE = 0.05;

export interface GuardrailCheck {
  ok: boolean;
  value: number | null;
  threshold: number;
  message?: string;
}

export function checkLiquidityReserve(liquidAssets: number, depositLiabilities: number): GuardrailCheck {
  const ratio = safeDiv(liquidAssets, depositLiabilities);
  const ok = ratio !== null && ratio >= LIQUIDITY_RESERVE_MIN;
  return {
    ok,
    value: ratio,
    threshold: LIQUIDITY_RESERVE_MIN,
    message: ok ? undefined : "Liquid assets have fallen below the 30% reserve requirement",
  };
}

export function checkLoanToDeposit(grossLoanPortfolio: number, totalDeposits: number): GuardrailCheck {
  const ratio = safeDiv(grossLoanPortfolio, totalDeposits);
  const ok = ratio === null ? true : ratio <= LOAN_TO_DEPOSIT_MAX;
  return {
    ok,
    value: ratio,
    threshold: LOAN_TO_DEPOSIT_MAX,
    message: ok ? undefined : "Loan portfolio exceeds 60% of total deposits",
  };
}

export function checkSingleBorrowerExposure(
  borrowerOutstanding: number,
  grossLoanPortfolio: number
): GuardrailCheck {
  const ratio = safeDiv(borrowerOutstanding, grossLoanPortfolio);
  const ok = ratio === null ? true : ratio <= SINGLE_BORROWER_MAX_SHARE;
  return {
    ok,
    value: ratio,
    threshold: SINGLE_BORROWER_MAX_SHARE,
    message: ok ? undefined : "Single borrower exposure exceeds 5% of the loan portfolio",
  };
}

/** Blocks a disbursement if it would breach the liquidity reserve or loan-to-deposit guardrails. */
export function canDisburse(
  disbursementAmount: number,
  currentLiquidAssets: number,
  currentGrossLoanPortfolio: number,
  totalDeposits: number
): GuardrailCheck {
  const postLiquidity = checkLiquidityReserve(currentLiquidAssets - disbursementAmount, totalDeposits);
  const postLoanToDeposit = checkLoanToDeposit(currentGrossLoanPortfolio + disbursementAmount, totalDeposits);

  if (!postLiquidity.ok) return postLiquidity;
  if (!postLoanToDeposit.ok) return postLoanToDeposit;
  return { ok: true, value: postLoanToDeposit.value, threshold: LOAN_TO_DEPOSIT_MAX };
}
