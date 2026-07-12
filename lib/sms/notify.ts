import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/sms/send";

export type SmsEvent =
  | "savings_deposit"
  | "savings_withdrawal"
  | "susu_contribution"
  | "susu_payout"
  | "loan_disbursement"
  | "loan_repayment"
  | "fd_booking"
  | "fd_maturity_payout"
  | "fd_early_withdrawal"
  | "fd_rollover";

/**
 * Single gating chokepoint for every client transaction SMS: checks the
 * client's phone/opt-in and the sms_settings product_config row before
 * calling sendSms. Never throws, so call sites can fire-and-await this
 * right after a successful ledger post with no extra try/catch.
 */
export async function notifyClient(
  supabase: ReturnType<typeof createAdminClient>,
  clientId: string,
  event: SmsEvent,
  message: string
) {
  try {
    const { data: client } = await supabase.from("clients").select("phone, sms_opt_in").eq("id", clientId).single();
    if (!client?.phone || !client.sms_opt_in) return;

    const { data: config } = await supabase.from("product_config").select("value").eq("key", "sms_settings").single();
    const settings = config?.value as { enabled?: boolean; events?: Record<string, boolean> } | undefined;
    if (!settings?.enabled || !settings.events?.[event]) return;

    await sendSms({ to: client.phone, message, event, clientId });
  } catch (err) {
    console.error(`Failed to notify client ${clientId} of ${event}:`, err);
  }
}
