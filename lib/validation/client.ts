import { z } from "zod";

export const PRODUCT_INTEREST_OPTIONS = [
  { value: "savings", label: "Savings" },
  { value: "daily-susu", label: "Daily Susu" },
  { value: "fixed-deposit", label: "Fixed Deposit" },
  { value: "loans", label: "Micro-Loans" },
] as const;

export const newClientSchema = z.object({
  // Personal info
  fullName: z.string().trim().min(2, "Enter the client's full name"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  smsOptIn: z.boolean().default(true),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["female", "male", "other"]).optional().or(z.literal("")),
  occupation: z.string().trim().optional().or(z.literal("")),

  // Identification — Ghana Card is the sole ID document
  ghanaCardNo: z
    .string()
    .trim()
    .regex(/^GHA-\d{9}-\d$/i, "Enter the Ghana Card number as GHA-XXXXXXXXX-X"),
  photoUrl: z.string().trim().optional().or(z.literal("")),

  // Location
  town: z.string().trim().min(2, "Enter a town"),
  region: z.string().trim().optional().or(z.literal("")),
  area: z.string().trim().optional().or(z.literal("")),
  digitalAddress: z.string().trim().optional().or(z.literal("")),

  // Product interest
  interestedProducts: z
    .array(z.enum(["savings", "daily-susu", "fixed-deposit", "loans"]))
    .min(1, "Select at least one product"),

  // Next of kin
  nextOfKinName: z.string().trim().min(2, "Enter next of kin's name"),
  nextOfKinRelationship: z.string().trim().min(2, "Enter next of kin's relationship to the client"),
  nextOfKinPhone: z.string().trim().min(9, "Enter next of kin's phone number"),
  nextOfKinAddress: z.string().trim().optional().or(z.literal("")),

  agentId: z.string().uuid().optional().or(z.literal("")),
});

export type NewClientInput = z.infer<typeof newClientSchema>;
