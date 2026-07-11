import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().min(9, "Enter a valid phone number").optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Enter a subject"),
  message: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)"),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
