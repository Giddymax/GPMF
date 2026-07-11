import { z } from "zod";

export const newClientSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the client's full name"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  ghanaCardNo: z.string().trim().min(5, "Enter the Ghana Card number").optional().or(z.literal("")),
  town: z.string().trim().min(2, "Enter a town"),
  agentId: z.string().uuid().optional().or(z.literal("")),
});

export type NewClientInput = z.infer<typeof newClientSchema>;
