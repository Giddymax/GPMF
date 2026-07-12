import { formatGHS } from "@/lib/utils";

const PREFIX = "GPFS:";

export const smsTemplates = {
  depositReceived: (amount: number) => `${PREFIX} We received your savings deposit of ${formatGHS(amount)}. Thank you for saving with us.`,
  withdrawalProcessed: (amount: number) => `${PREFIX} A withdrawal of ${formatGHS(amount)} was processed on your savings account.`,
  susuContributionReceived: (amount: number) => `${PREFIX} We received your susu contribution of ${formatGHS(amount)} today.`,
  susuPayoutCompleted: (amount: number) => `${PREFIX} Your susu cycle payout of ${formatGHS(amount)} has been paid out. Thank you for saving with us.`,
  loanDisbursed: (amount: number, loanNumber: string) => `${PREFIX} Your loan ${loanNumber} of ${formatGHS(amount)} has been disbursed.`,
  loanRepaymentReceived: (amount: number, loanNumber: string) => `${PREFIX} We received your repayment of ${formatGHS(amount)} on loan ${loanNumber}.`,
  fdBooked: (amount: number, fdNumber: string) => `${PREFIX} Your fixed deposit ${fdNumber} of ${formatGHS(amount)} has been booked.`,
  fdMaturityPaidOut: (amount: number, fdNumber: string) => `${PREFIX} Your fixed deposit ${fdNumber} has matured and ${formatGHS(amount)} (principal + interest) has been paid out.`,
  fdEarlyWithdrawalPaid: (amount: number, fdNumber: string) => `${PREFIX} Your early withdrawal on fixed deposit ${fdNumber} has been approved. ${formatGHS(amount)} (principal only) has been paid out.`,
  fdRolledOver: (amount: number, oldFdNumber: string, newFdNumber: string) =>
    `${PREFIX} Your fixed deposit ${oldFdNumber} has been rolled over into ${newFdNumber} with a new principal of ${formatGHS(amount)}.`,
};
