import { z } from "zod";

export const PRODUCT_OPTIONS = [
  { value: "savings", label: "Savings account" },
  { value: "daily-susu", label: "Daily susu" },
  { value: "fixed-deposit", label: "Fixed deposit" },
  { value: "loans", label: "Micro-loan" },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export const applicationSchema = z.object({
  product: z.enum(["savings", "daily-susu", "fixed-deposit", "loans"], {
    message: "Choose a product",
  }),
  fullName: z.string().trim().min(2, "Enter your full name"),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, "Enter a valid 10-digit phone number starting with 0"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  ghanaCardNo: z
    .string()
    .trim()
    .regex(/^GHA-\d{9}-\d$/i, "Enter your Ghana Card number as GHA-XXXXXXXXX-X")
    .optional()
    .or(z.literal("")),
  town: z.string().trim().min(2, "Enter your town"),
  amount: z
    .number({ message: "Enter an amount" })
    .min(1, "Enter an amount greater than zero"),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
