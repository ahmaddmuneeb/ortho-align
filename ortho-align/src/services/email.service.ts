import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

export class EmailService {
  static async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const mailer = getTransporter();

    if (!mailer) {
      // SMTP not configured (e.g. local dev) — log instead of failing the request.
      console.warn(`SMTP not configured. Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    await mailer.sendMail({
      from: config.smtp.from,
      to,
      subject: 'Reset your OrthoAlign password',
      text: `We received a request to reset your OrthoAlign password.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
      html: `
        <p>We received a request to reset your OrthoAlign password.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }
}
