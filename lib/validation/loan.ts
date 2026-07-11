import { z } from "zod";

export const newLoanSchema = z.object({
  clientId: z.string().uuid(),
  principal: z.number().min(50, "Minimum loan is GHS 50"),
  termMonths: z.number().min(1).max(12),
  frequency: z.enum(["daily", "weekly", "monthly"]),
});

export type NewLoanInput = z.infer<typeof newLoanSchema>;
