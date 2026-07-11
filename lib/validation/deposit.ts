import { z } from "zod";

export const WITHDRAWAL_APPROVAL_THRESHOLD = 500;

export const savingsTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.number().min(1, "Enter an amount greater than zero"),
});

export type SavingsTransactionInput = z.infer<typeof savingsTransactionSchema>;

export const fdBookingSchema = z.object({
  clientId: z.string().uuid(),
  principal: z.number().min(500, "Minimum fixed deposit is GHS 500"),
  termMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]),
});

export type FdBookingInput = z.infer<typeof fdBookingSchema>;
