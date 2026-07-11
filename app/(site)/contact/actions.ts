"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { StaffNotificationEmail } from "@/lib/email/templates/staff-notification";
import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry";

export interface SubmitInquiryResult {
  ok: boolean;
  error?: string;
}

export async function submitInquiry(input: InquiryInput): Promise<SubmitInquiryResult> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form for errors and try again." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").insert({
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    subject: data.subject,
    message: data.message,
    status: "new",
  });

  if (error) {
    console.error("Failed to submit inquiry:", error);
    return { ok: false, error: "We couldn't send your message. Please try again or call us." };
  }

  await sendEmail({
    to: process.env.STAFF_NOTIFICATION_EMAIL || "operations@grainypalacefinancial.com",
    subject: `New inquiry: ${data.subject}`,
    react: StaffNotificationEmail({
      heading: "New website inquiry",
      lines: [
        { label: "Name", value: data.name },
        { label: "Phone", value: data.phone || "—" },
        { label: "Email", value: data.email || "—" },
        { label: "Subject", value: data.subject },
        { label: "Message", value: data.message },
      ],
    }),
  }).catch(() => undefined);

  return { ok: true };
}
