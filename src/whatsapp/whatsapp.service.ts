import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      sub_type?: string;
      index?: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID')!;
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN')!;
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;

    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn('WhatsApp credentials not configured. WhatsApp OTP will not work.');
    }
  }

  /**
   * Send OTP via WhatsApp
   * Uses template message only (required for WhatsApp Business API)
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    try {
      // Clean phone number (remove + and spaces)
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

      // Send using template (only option)
      await this.sendTemplateOtp(cleanNumber, otp);

      this.logger.log(`WhatsApp OTP sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp OTP', error);
      throw new Error('Failed to send WhatsApp OTP');
    }
  }

  /**
   * Send OTP using WhatsApp template
   * Template must be pre-approved by Meta
   */
  private async sendTemplateOtp(phoneNumber: string, otp: string): Promise<void> {
    const message: WhatsAppTemplateMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'otp', // Your template name in Meta Business
        language: {
          code: 'en',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otp,
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              {
                type: 'text',
                text: otp,
              },
            ],
          },
        ],
      },
    };

    await this.sendMessage(message);
  }

  /**
   * Send WhatsApp message via Meta API
   */
  private async sendMessage(message: WhatsAppTemplateMessage): Promise<void> {
    try {
      const response = await axios.post(this.apiUrl, message, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`WhatsApp message sent successfully: ${response.data.messages[0].id}`);
    } catch (error: any) {
      if (error.response) {
        this.logger.error('WhatsApp API error', {
          status: error.response.status,
          data: error.response.data,
        });
        throw new Error(error.response.data.error?.message || 'WhatsApp API error');
      }
      throw error;
    }
  }

  /**
   * Send welcome message via WhatsApp
   * Note: Requires approved template for production
   */
  async sendWelcomeMessage(phoneNumber: string, username: string): Promise<void> {
    try {
      this.logger.log(`Welcome message skipped for ${phoneNumber} - template not configured`);
      // Welcome message requires separate template approval
      // Create template named "welcome" in Meta Business Manager if needed
    } catch (error) {
      this.logger.error('Failed to send welcome message', error);
      // Don't throw - welcome message is not critical
    }
  }

  /**
   * Verify WhatsApp webhook signature
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    const crypto = require('crypto');
    const webhookSecret = this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.warn('WHATSAPP_WEBHOOK_SECRET not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Check if WhatsApp service is configured
   */
  isConfigured(): boolean {
    return !!(this.phoneNumberId && this.accessToken);
  }
}
