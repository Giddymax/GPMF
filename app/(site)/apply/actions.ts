"use server";

import { applicationSchema, PRODUCT_OPTIONS, type ApplicationInput } from "@/lib/validation/application";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { ApplicationConfirmationEmail } from "@/lib/email/templates/application-confirmation";
import { StaffNotificationEmail } from "@/lib/email/templates/staff-notification";

function generateReferenceCode() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GP-${Date.now().toString(36).toUpperCase()}${random}`;
}

export interface SubmitApplicationResult {
  ok: boolean;
  referenceCode?: string;
  error?: string;
}

export async function submitApplication(input: ApplicationInput): Promise<SubmitApplicationResult> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form for errors and try again." };
  }
  const data = parsed.data;
  const referenceCode = generateReferenceCode();
  const productLabel = PRODUCT_OPTIONS.find((p) => p.value === data.product)?.label ?? data.product;

  const supabase = await createClient();
  const { error } = await supabase.from("applications").insert({
    reference_code: referenceCode,
    product: data.product,
    full_name: data.fullName,
    phone: data.phone,
    email: data.email || null,
    ghana_card_no: data.ghanaCardNo || null,
    town: data.town,
    amount: data.amount,
    frequency: data.frequency ?? null,
    status: "new",
  });

  if (error) {
    console.error("Failed to submit application:", error);
    return { ok: false, error: "We couldn't submit your application. Please try again or call us." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (data.email) {
    await sendEmail({
      to: data.email,
      subject: `We received your ${productLabel} application`,
      react: ApplicationConfirmationEmail({
        fullName: data.fullName,
        product: productLabel,
        referenceCode,
        siteUrl,
      }),
    }).catch(() => undefined);
  }

  await sendEmail({
    to: process.env.STAFF_NOTIFICATION_EMAIL || "operations@grainypalacefinancial.com",
    subject: `New application: ${productLabel} — ${data.fullName}`,
    react: StaffNotificationEmail({
      heading: "New website application",
      lines: [
        { label: "Reference", value: referenceCode },
        { label: "Product", value: productLabel },
        { label: "Name", value: data.fullName },
        { label: "Phone", value: data.phone },
        { label: "Town", value: data.town },
        { label: "Amount", value: String(data.amount) },
      ],
    }),
  }).catch(() => undefined);

  return { ok: true, referenceCode };
}
