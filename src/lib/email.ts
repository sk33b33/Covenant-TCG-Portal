import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return cachedTransporter;
}

/**
 * Sends transactional email (verification, password reset). If SMTP
 * credentials are not configured — the default for local development — the
 * message is logged to the server console instead of being sent. This is a
 * development convenience only; production deployments must set the SMTP_*
 * environment variables (see .env.example) or emails will silently never
 * reach players.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || "Covenant TCG <no-reply@localhost>";

  if (!transporter) {
    console.log(
      `\n[dev email fallback] SMTP is not configured — printing message instead of sending.\n` +
        `To: ${to}\nSubject: ${subject}\n\n${text}\n`,
    );
    return;
  }

  await transporter.sendMail({ from, to, subject, html, text });
}

export function verificationEmailContent(verifyUrl: string) {
  const text = `Welcome to Covenant. Verify your email to finish setting up your account:\n\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create a Covenant account, you can ignore this email.`;
  const html = `
    <p>Welcome to Covenant.</p>
    <p>Verify your email to finish setting up your account:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>This link expires in 24 hours. If you didn't create a Covenant account, you can ignore this email.</p>
  `;
  return { subject: "Verify your Covenant account", text, html };
}

export function passwordResetEmailContent(resetUrl: string) {
  const text = `A password reset was requested for your Covenant account.\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.`;
  const html = `
    <p>A password reset was requested for your Covenant account.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
  `;
  return { subject: "Reset your Covenant password", text, html };
}
