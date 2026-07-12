import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const ARKESEL_SEND_URL = "https://sms.arkesel.com/api/v2/sms/send";

function isSmsConfigured() {
  return Boolean(process.env.ARKESEL_API_KEY);
}

/** Rewrites a locally-entered Ghanaian number (e.g. "024 123 4567") into Arkesel's expected 233XXXXXXXXX form. */
function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return digits;
}

async function logSms(params: {
  phone: string;
  clientId?: string;
  event: string;
  message: string;
  status: "sent" | "failed" | "skipped";
  providerResponse?: string;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("sms_log").insert({
      recipient_phone: params.phone,
      client_id: params.clientId ?? null,
      event: params.event,
      message: params.message,
      status: params.status,
      provider_response: params.providerResponse ?? null,
    });
  } catch (err) {
    console.error("Failed to write sms_log row:", err);
  }
}

/**
 * Every caller wraps its Arkesel call through here so a missing/placeholder
 * ARKESEL_API_KEY degrades to a console log + sms_log row instead of
 * throwing and breaking the transaction the SMS was meant to confirm.
 * Never throws.
 */
export async function sendSms(params: { to: string; message: string; event: string; clientId?: string }) {
  const phone = normalizePhone(params.to);

  if (!isSmsConfigured()) {
    console.info(`[sms:skipped, no ARKESEL_API_KEY] "${params.event}" -> ${phone}`);
    await logSms({ phone, clientId: params.clientId, event: params.event, message: params.message, status: "skipped" });
    return { skipped: true as const };
  }

  try {
    const response = await fetch(ARKESEL_SEND_URL, {
      method: "POST",
      headers: {
        "api-key": process.env.ARKESEL_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: process.env.ARKESEL_SENDER_ID || "GPFS",
        message: params.message,
        recipients: [phone],
      }),
    });
    const responseText = await response.text();

    if (!response.ok) {
      await logSms({
        phone,
        clientId: params.clientId,
        event: params.event,
        message: params.message,
        status: "failed",
        providerResponse: responseText,
      });
      return { skipped: true as const };
    }

    await logSms({
      phone,
      clientId: params.clientId,
      event: params.event,
      message: params.message,
      status: "sent",
      providerResponse: responseText,
    });
    return { skipped: false as const };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    await logSms({
      phone,
      clientId: params.clientId,
      event: params.event,
      message: params.message,
      status: "failed",
      providerResponse: error instanceof Error ? error.message : String(error),
    });
    return { skipped: true as const, error };
  }
}
