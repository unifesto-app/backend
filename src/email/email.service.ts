import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email service will not work.');
    }
    
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'onboarding@resend.dev');
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your Unifesto Login Code',
        html: this.getOtpEmailTemplate(otp),
      });

      if (error) {
        this.logger.error('Failed to send OTP email', error);
        throw new Error('Failed to send email');
      }

      this.logger.log(`OTP email sent to ${email}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error('Error sending OTP email', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to Unifesto!',
        html: this.getWelcomeEmailTemplate(username),
      });

      if (error) {
        this.logger.error('Failed to send welcome email', error);
        throw new Error('Failed to send email');
      }

      this.logger.log(`Welcome email sent to ${email}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error('Error sending welcome email', error);
      // Don't throw - welcome email is not critical
    }
  }

  /**
   * OTP Email Template
   */
  private getOtpEmailTemplate(otp: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Unifesto Login Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">Unifesto</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Your Login Code</h2>
              
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 24px;">
                Use this code to complete your login to Unifesto:
              </p>
              
              <!-- OTP Code -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 20px;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 20px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 18px; text-align: center;">
                © ${new Date().getFullYear()} Unifesto. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Welcome Email Template
   */
  private getWelcomeEmailTemplate(username: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Unifesto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">Welcome to Unifesto! 🎉</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
                Hi ${username || 'there'},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
                Your account has been successfully created! You're now part of the Unifesto community.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 24px;">
                Get started by exploring events, connecting with organizers, and joining communities.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="https://unifesto.app" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Open Unifesto
                </a>
              </div>
              
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 20px;">
                Need help? Contact us at support@unifesto.app
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 18px; text-align: center;">
                © ${new Date().getFullYear()} Unifesto. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
