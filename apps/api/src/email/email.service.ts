import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM') ?? 'Vantage <noreply@vantage.app>';
  }

  async sendInvite(to: string, inviteUrl: string, inviterName: string): Promise<void> {
    await this.send(to, `You've been invited to Vantage`, this.inviteHtml(inviteUrl, inviterName));
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.send(to, 'Reset your Vantage password', this.resetHtml(resetUrl));
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${String(err)}`);
    }
  }

  private inviteHtml(inviteUrl: string, inviterName: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
        <h2 style="color:#0D7A75;margin-bottom:8px">You've been invited to Vantage</h2>
        <p style="color:#64748B">${inviterName} has invited you to join their workspace.</p>
        <a href="${inviteUrl}" style="display:inline-block;margin-top:24px;padding:10px 24px;background:#0D7A75;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Accept Invitation
        </a>
        <p style="margin-top:24px;font-size:12px;color:#94A3B8">This link expires in 48 hours. If you didn't expect this invitation, you can ignore this email.</p>
      </div>`;
  }

  private resetHtml(resetUrl: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
        <h2 style="color:#0D7A75;margin-bottom:8px">Reset your password</h2>
        <p style="color:#64748B">We received a request to reset your Vantage password. Click below to choose a new one.</p>
        <a href="${resetUrl}" style="display:inline-block;margin-top:24px;padding:10px 24px;background:#0D7A75;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="margin-top:24px;font-size:12px;color:#94A3B8">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>`;
  }
}
