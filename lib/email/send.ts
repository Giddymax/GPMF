import "server-only";
import { Resend } from "resend";

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Every caller wraps its Resend call through here so a missing/placeholder
 * RESEND_API_KEY degrades to a console log in dev instead of throwing and
 * breaking the form submission the email was meant to celebrate.
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  if (!isEmailConfigured()) {
    console.info(`[email:skipped, no RESEND_API_KEY] "${params.subject}" -> ${params.to}`);
    return { skipped: true as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || "Grainy Palace Financial Service <noreply@grainypalacefinancial.com>";

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      react: params.react,
    });
    return { skipped: false as const, result };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { skipped: true as const, error };
  }
}
