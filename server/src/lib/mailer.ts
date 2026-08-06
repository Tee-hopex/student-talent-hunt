interface MailInput {
  to: string;
  subject: string;
  text: string;
}

/**
 * Dev-stub mailer: logs to console instead of sending. Swap this
 * implementation for Resend/SMTP later — every caller already goes
 * through this single function.
 */
export async function sendMail({ to, subject, text }: MailInput): Promise<void> {
  console.log(`\n[mailer] → ${to}\nSubject: ${subject}\n${text}\n`);
}
