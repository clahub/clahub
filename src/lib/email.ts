import { Resend } from "resend";
import { logger } from "@/lib/logger";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM ?? "CLAHub <noreply@cla-hub.io>";

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();
  if (!client) {
    logger.warn("Email not sent — RESEND_API_KEY is not configured", {
      action: "email.send",
      to,
      subject,
    });
    return;
  }

  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error("Failed to send email", {
      action: "email.send",
      to,
      subject,
      error: error.message,
    });
  }
}

export async function notifyNewSignature({
  agreementId,
  signerName,
  signerLogin,
  ownerEmail,
  agreementLabel,
}: {
  agreementId: number;
  signerName: string | null;
  signerLogin: string;
  ownerEmail: string;
  agreementLabel: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? "https://cla-hub.io";
  const editUrl = `${appUrl}/agreements/edit/${agreementId}`;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayName = signerName ?? signerLogin;

  await sendEmail({
    to: ownerEmail,
    subject: `New CLA signature: ${signerLogin} signed ${agreementLabel}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">New CLA Signature</h2>
        <p style="margin: 0 0 8px; color: #374151;">
          <strong>${escapeHtml(displayName)}</strong> (${escapeHtml(signerLogin)}) signed your agreement.
        </p>
        <table style="margin: 16px 0; border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Agreement</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(agreementLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Signer</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(displayName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #6b7280;">GitHub</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(signerLogin)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Date</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${date}</td>
          </tr>
        </table>
        <a href="${editUrl}" style="display: inline-block; padding: 10px 20px; background-color: #111827; color: #fff; text-decoration: none; border-radius: 6px;">
          View Agreement
        </a>
        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          You received this email because notifications are enabled for this agreement on CLAHub.
        </p>
      </div>
    `,
  });
}

export async function notifyImportComplete({
  agreementId,
  ownerEmail,
  agreementLabel,
  importedCount,
}: {
  agreementId: number;
  ownerEmail: string;
  agreementLabel: string;
  importedCount: number;
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? "https://cla-hub.io";
  const editUrl = `${appUrl}/agreements/edit/${agreementId}`;

  await sendEmail({
    to: ownerEmail,
    subject: `CSV import complete: ${importedCount} signature${importedCount === 1 ? "" : "s"} added to ${agreementLabel}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">CSV Import Complete</h2>
        <p style="margin: 0 0 16px; color: #374151;">
          <strong>${importedCount}</strong> signature${importedCount === 1 ? " was" : "s were"} imported to <strong>${escapeHtml(agreementLabel)}</strong>.
        </p>
        <a href="${editUrl}" style="display: inline-block; padding: 10px 20px; background-color: #111827; color: #fff; text-decoration: none; border-radius: 6px;">
          View Agreement
        </a>
        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          You received this email because notifications are enabled for this agreement on CLAHub.
        </p>
      </div>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
