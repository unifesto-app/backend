import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface WhatsAppTemplateComponent {
  type: string;
  sub_type?: string;
  index?: string;
  parameters: Array<{
    type: string;
    text?: string;
    image?: { link: string };
  }>;
}

interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: WhatsAppTemplateComponent[];
  };
}

// Approved template IDs from Meta
const TEMPLATES = {
  OTP: 'otp', // id: 2217845882320700
  EVENT_REGISTRATION: 'event_registration_confirmation', // id: 1543620650451828
  EVENT_REMINDER: 'event_reminder_24h', // id: 1597512415277975
  REGISTRATION_CANCELLED: 'registration_cancelled', // id: 1972305506770198
  SPACE_APPROVED: 'space_approved', // id: 1603977184033350
  SPACE_REJECTED: 'space_rejected', // id: 973091392100936
  CHECKIN_CONFIRMED: 'checkin_confirmed', // id: 1687119155773855
  PAYMENT_CONFIRMED: 'payment_confirmed', // id: 4462855363943057
  NEW_SPACE_SUBMITTED: 'new_space_submitted', // id: 1011838481193096 (PENDING)
} as const;

// Header images from S3 bucket
const HEADER_IMAGES = {
  EVENT_REGISTRATION: 'https://unifesto-storage-bucket.s3.ap-south-1.amazonaws.com/whatsapp-headers/registration_confirmed.png',
  SPACE_APPROVED: 'https://unifesto-storage-bucket.s3.ap-south-1.amazonaws.com/whatsapp-headers/space_approved.png',
  CHECKIN_CONFIRMED: 'https://unifesto-storage-bucket.s3.ap-south-1.amazonaws.com/whatsapp-headers/checkin.png',
} as const;

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
      this.logger.warn('WhatsApp credentials not configured. WhatsApp notifications will not work.');
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  /**
   * Format phone number for WhatsApp API
   * Ensures country code and removes invalid characters
   */
  private formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except leading +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If starts with +, keep it; otherwise add country code if needed
    if (!cleaned.startsWith('+')) {
      // Assume Indian number if no country code
      cleaned = '+91' + cleaned.replace(/^0+/, '');
    }
    
    return cleaned;
  }

  /**
   * Format event date
   * Output: "1 July 2026"
   */
  private formatEventDate(dateTime: Date, timezone = 'Asia/Kolkata'): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    }).format(dateTime);
  }

  /**
   * Format event time range
   * Output: "10:00 AM - 01:00 PM IST"
   */
  private formatEventTime(startTime: Date, endTime: Date, timezone = 'Asia/Kolkata'): string {
    const formatTime = (date: Date) => 
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(date);

    return `${formatTime(startTime)} - ${formatTime(endTime)} IST`;
  }

  /**
   * Format venue string based on event type
   */
  private formatVenue(event: {
    type: string;
    venueName?: string;
    city?: string;
    onlineUrl?: string;
  }): string {
    if (event.type === 'ONLINE') {
      return `Online - ${event.onlineUrl || 'Link will be shared'}`;
    } else if (event.type === 'HYBRID') {
      const physical = event.venueName && event.city 
        ? `${event.venueName}, ${event.city}` 
        : 'Venue TBA';
      return `${physical} + Online`;
    } else {
      // IN_PERSON
      return event.venueName && event.city 
        ? `${event.venueName}, ${event.city}` 
        : 'Venue TBA';
    }
  }

  // =====================================================
  // CORE MESSAGING FUNCTIONS
  // =====================================================

  /**
   * Send template message via WhatsApp API
   */
  private async sendTemplateMessage(
    to: string,
    templateName: string,
    bodyParameters: string[],
    hasImageHeader = false,
    imageUrl?: string,
  ): Promise<void> {
    // Skip if phone number is empty
    if (!to) {
      this.logger.warn('Skipping WhatsApp send - empty phone number');
      return;
    }

    const formattedPhone = this.formatPhoneNumber(to);
    if (!formattedPhone) {
      this.logger.warn(`Invalid phone number format: ${to}`);
      return;
    }

    try {
      const components: WhatsAppTemplateComponent[] = [];

      // Add header component if image is required
      if (hasImageHeader && imageUrl) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: { link: imageUrl },
            },
          ],
        });
      }

      // Add body component with text parameters
      components.push({
        type: 'body',
        parameters: bodyParameters.map((text) => ({
          type: 'text',
          text,
        })),
      });

      const message: WhatsAppTemplateMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en',
          },
          components,
        },
      };

      const response = await axios.post(this.apiUrl, message, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.messages?.[0]?.id;
      this.logger.log(`WhatsApp template sent: ${templateName} to ${formattedPhone}, ID: ${messageId}`);
    } catch (error: any) {
      if (error.response) {
        this.logger.error(`WhatsApp API error for template ${templateName}`, {
          status: error.response.status,
          error: error.response.data?.error,
          phone: formattedPhone,
        });
      } else {
        this.logger.error(`WhatsApp send error for template ${templateName}`, error);
      }
      // DO NOT throw - notification failures must never break main flow
    }
  }

  // =====================================================
  // EXISTING METHODS (Keep unchanged signatures)
  // =====================================================

  /**
   * Send OTP via WhatsApp using approved template
   * Template: otp (id: 2217845882320700)
   * Has "Copy code" button
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone) {
        this.logger.warn(`Invalid phone number format: ${phoneNumber}`);
        return;
      }
      const message = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: TEMPLATES.OTP,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: otp }],
            },
          ],
        },
      };
      const axios = require('axios');
      await axios.post(this.apiUrl, message, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`WhatsApp OTP sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp OTP', error);
    }
  }

  /**
   * Send welcome message via WhatsApp
   * Note: Currently not configured - requires template approval
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

  /**
   * Verify Meta's webhook subscription handshake.
   * Meta sends GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
   * We must echo back the challenge iff the token matches ours.
   * Returns the challenge string on success, or null on failure.
   */
  verifyWebhookChallenge(
    mode: string | undefined,
    token: string | undefined,
    challenge: string | undefined,
  ): string | null {
    const verifyToken = this.configService.get<string>(
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    );

    if (!verifyToken) {
      this.logger.warn('WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
      return null;
    }

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      this.logger.log('WhatsApp webhook verification succeeded');
      return challenge;
    }

    this.logger.warn('WhatsApp webhook verification failed (mode/token mismatch)');
    return null;
  }

  /**
   * Process an inbound WhatsApp webhook payload (messages and statuses).
   * Meta always expects a fast 200 response; heavy work should be async.
   */
  handleWebhookPayload(body: any): void {
    try {
      const entries = Array.isArray(body?.entry) ? body.entry : [];

      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];

        for (const change of changes) {
          const value = change?.value ?? {};

          // Inbound messages from users
          const messages = Array.isArray(value.messages) ? value.messages : [];
          for (const message of messages) {
            this.logger.log(
              `Inbound WhatsApp message from ${message.from} (type=${message.type})`,
            );
          }

          // Delivery / read status updates for messages we sent
          const statuses = Array.isArray(value.statuses) ? value.statuses : [];
          for (const status of statuses) {
            this.logger.log(
              `WhatsApp message ${status.id} status=${status.status} recipient=${status.recipient_id}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process WhatsApp webhook payload: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // =====================================================
  // TEMPLATE-BASED NOTIFICATIONS
  // =====================================================

  /**
   * 1. Event Registration Confirmation
   * Template: event_registration_confirmation (id: 1543620650451828)
   * Header: IMAGE
   * Body: {{1}}=userName, {{2}}=eventTitle, {{3}}=eventDate, {{4}}=eventTime, {{5}}=venue
   */
  async sendRegistrationConfirmation(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      eventDate: string;
      eventTime: string;
      venueName?: string;
      city?: string;
      isOnline: boolean;
      onlineUrl?: string;
    },
  ): Promise<void> {
    try {
      if (!mobileNumber) return;

      const venue = this.formatVenue({
        type: data.isOnline ? 'ONLINE' : 'IN_PERSON',
        venueName: data.venueName,
        city: data.city,
        onlineUrl: data.onlineUrl,
      });

      await this.sendTemplateMessage(
        mobileNumber,
        TEMPLATES.EVENT_REGISTRATION,
        [
          data.userName,
          data.eventTitle,
          data.eventDate,
          data.eventTime,
          venue,
        ],
        true, // has image header
        HEADER_IMAGES.EVENT_REGISTRATION,
      );
    } catch (error) {
      this.logger.error('Failed to send registration confirmation', error);
    }
  }

  /**
   * 2. Event Reminder (24 hours before)
   * Template: event_reminder_24h (id: 1597512415277975)
   * Header: none
   * Body: {{1}}=userName, {{2}}=eventTitle, {{3}}=eventDate, {{4}}=eventTime, {{5}}=venue
   */
  async sendEventReminder(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      eventDate: string;
      eventTime: string;
      venueName?: string;
      city?: string;
      isOnline: boolean;
      onlineUrl?: string;
    },
  ): Promise<void> {
    try {
      if (!mobileNumber) return;

      const venue = this.formatVenue({
        type: data.isOnline ? 'ONLINE' : 'IN_PERSON',
        venueName: data.venueName,
        city: data.city,
        onlineUrl: data.onlineUrl,
      });

      await this.sendTemplateMessage(
        mobileNumber,
        TEMPLATES.EVENT_REMINDER,
        [
          data.userName,
          data.eventTitle,
          data.eventDate,
          data.eventTime,
          venue,
        ],
        false, // no image header
      );
    } catch (error) {
      this.logger.error('Failed to send event reminder', error);
    }
  }

  /**
   * 3. Registration Cancelled
   * Template: registration_cancelled (id: 1972305506770198)
   * Header: TEXT
   * Body: {{1}}=userName, {{2}}=eventTitle, {{3}}=refundInfo
   */
  async sendRegistrationCancelled(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      coinsRefunded?: number;
      razorpayRefundInitiated?: boolean;
    },
  ): Promise<void> {
    try {
      if (!mobileNumber) return;

      let refundInfo = 'No refunds applicable.';
      const refundParts: string[] = [];

      if (data.coinsRefunded && data.coinsRefunded > 0) {
        refundParts.push(`${data.coinsRefunded} coins refunded to wallet`);
      }
      if (data.razorpayRefundInitiated) {
        refundParts.push('Payment refund initiated (5-7 business days)');
      }

      if (refundParts.length > 0) {
        refundInfo = refundParts.join('. ');
      }

      await this.sendTemplateMessage(
        mobileNumber,
        TEMPLATES.REGISTRATION_CANCELLED,
        [
          data.userName,
          data.eventTitle,
          refundInfo,
        ],
        false, // TEXT header (handled by template)
      );
    } catch (error) {
      this.logger.error('Failed to send cancellation notification', error);
    }
  }

  /**
   * 4. Space Approved
   * Template: space_approved (id: 1603977184033350)
   * Header: IMAGE
   * Body: {{1}}=organizerName, {{2}}=spaceName
   */
  async sendSpaceApproved(
    mobileNumber: string,
    data: {
      organizerName: string;
      spaceName: string;
    },
  ): Promise<void> {
    try {
      if (!mobileNumber) return;

      await this.sendTemplateMessage(
        mobileNumber,
        TEMPLATES.SPACE_APPROVED,
        [
          data.organizerName,
          data.spaceName,
        ],
        true, // has image header
        HEADER_IMAGES.SPACE_APPROVED,
      );
    } catch (error) {
      this.logger.error('Failed to send space approved notification', error);
    }
  }

  /**
   * 5. Space Rejected
   * Template: space_rejected (id: 973091392100936)
   * Header: TEXT
   * Body: {{1}}=organizerName, {{2}}=spaceName, {{3}}=rejectionReason
   */
  async sendSpaceRejected(
    mobileNumber: string,
    data: {
      organizerName: string;
      spaceName: string;
      rejectionReason: string;
    },
  ): Promise<void> {
    try {
      if (!mobileNumber) return;

      await this.sendTemplateMessage(
        mobileNumber,
        TEMPLATES.SPACE_REJECTED,
        [
          data.organizerName,
          data.spaceName,
          data.rejectionReason || 'Not specified',
        ],
        false, // TEXT header (handled by template)
      );
    } catch (error) {
      this.logger.error('Failed to send space rejected notification', error);
    }
  }

  /**
   * 6. Check-in Confirmed
   * Template: checkin_confirmed (id: 1687119155773855)
   * Header: IMAGE
   * Body: {{1}}=userName, {{2}}=eventTitle, {{3}}=coinsAwarded
   */
  async sendCheckinConfirmed(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      coinsAwarded: number;
    },
  ): Promise<void> {
    try {
      if (!mobileNumber) return;

      await this.sendTemplateMessage(
        mobileNumber,
        TEMPLATES.CHECKIN_CONFIRMED,
        [
          data.userName,
          data.eventTitle,
          data.coinsAwarded.toString(),
        ],
        true, // has image header
        HEADER_IMAGES.CHECKIN_CONFIRMED,
      );
    } catch (error) {
      this.logger.error('Failed to send check-in confirmation', error);
    }
  }

  /**
   * 7. Payment Confirmed
   * Template: payment_confirmed (id: 4462855363943057)
   * Header: TEXT
   * Body: {{1}}=userName, {{2}}=eventTitle, {{3}}=amount, {{4}}=coinsInfo
   */
  async sendPaymentConfirmed(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      amount: number;
      coinsUsed?: number;
    },
  ): Promise<void> {
    try {
      if (!mobileNumber) return;

      const coinsInfo = data.coinsUsed && data.coinsUsed > 0
        ? `${data.coinsUsed} coins used`
        : 'No coins used';

      await this.sendTemplateMessage(
        mobileNumber,
        TEMPLATES.PAYMENT_CONFIRMED,
        [
          data.userName,
          data.eventTitle,
          `₹${data.amount.toFixed(2)}`,
          coinsInfo,
        ],
        false, // TEXT header (handled by template)
      );
    } catch (error) {
      this.logger.error('Failed to send payment confirmation', error);
    }
  }

  /**
   * 8. New Space Submitted (to admin)
   * Template: new_space_submitted (id: 1011838481193096) - PENDING APPROVAL
   * Header: TEXT
   * Body: {{1}}=spaceName, {{2}}=organizerName
   */
  async sendNewSpaceSubmitted(
    adminMobileNumber: string,
    data: {
      spaceName: string;
      organizerName: string;
    },
  ): Promise<void> {
    try {
      if (!adminMobileNumber) return;

      await this.sendTemplateMessage(
        adminMobileNumber,
        TEMPLATES.NEW_SPACE_SUBMITTED,
        [
          data.spaceName,
          data.organizerName,
        ],
        false, // TEXT header (handled by template)
      );
    } catch (error) {
      this.logger.error('Failed to send new space notification', error);
    }
  }

  // =====================================================
  // LEGACY METHOD ALIASES (for backward compatibility)
  // =====================================================

  /**
   * Alias for sendRegistrationCancelled
   * @deprecated Use sendRegistrationCancelled instead
   */
  async sendCancellationNotification(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      coinsRefunded?: number;
      razorpayRefundInitiated?: boolean;
    },
  ): Promise<void> {
    return this.sendRegistrationCancelled(mobileNumber, data);
  }

  /**
   * Alias for sendSpaceApproved
   * @deprecated Use sendSpaceApproved instead
   */
  async sendSpaceApprovedNotification(
    mobileNumber: string,
    data: {
      userName: string;
      spaceName: string;
      spaceSlug: string;
    },
  ): Promise<void> {
    return this.sendSpaceApproved(mobileNumber, {
      organizerName: data.userName,
      spaceName: data.spaceName,
    });
  }

  /**
   * Alias for sendSpaceRejected
   * @deprecated Use sendSpaceRejected instead
   */
  async sendSpaceRejectedNotification(
    mobileNumber: string,
    data: {
      userName: string;
      spaceName: string;
      rejectionReason?: string;
    },
  ): Promise<void> {
    return this.sendSpaceRejected(mobileNumber, {
      organizerName: data.userName,
      spaceName: data.spaceName,
      rejectionReason: data.rejectionReason || 'Not specified',
    });
  }

  /**
   * Alias for sendCheckinConfirmed
   * @deprecated Use sendCheckinConfirmed instead
   */
  async sendCheckinConfirmation(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      coinsAwarded: number;
    },
  ): Promise<void> {
    return this.sendCheckinConfirmed(mobileNumber, data);
  }

  /**
   * Alias for sendPaymentConfirmed
   * @deprecated Use sendPaymentConfirmed instead
   */
  async sendPaymentConfirmation(
    mobileNumber: string,
    data: {
      userName: string;
      eventTitle: string;
      amount: number;
      coinsUsed?: number;
      ticketCode: string;
    },
  ): Promise<void> {
    return this.sendPaymentConfirmed(mobileNumber, {
      userName: data.userName,
      eventTitle: data.eventTitle,
      amount: data.amount,
      coinsUsed: data.coinsUsed,
    });
  }

  /**
   * Alias for sendNewSpaceSubmitted
   * @deprecated Use sendNewSpaceSubmitted instead
   */
  async sendNewSpaceSubmittedNotification(
    adminMobileNumber: string,
    data: {
      spaceName: string;
      organiserName: string;
      spaceSlug: string;
    },
  ): Promise<void> {
    return this.sendNewSpaceSubmitted(adminMobileNumber, {
      spaceName: data.spaceName,
      organizerName: data.organiserName,
    });
  }

  /**
   * Coins received notification
   * Note: No approved template yet - logs only
   */
  async sendCoinsReceivedNotification(
    mobileNumber: string,
    data: {
      userName: string;
      coinsReceived: number;
      newBalance: number;
      reason: string;
    },
  ): Promise<void> {
    try {
      this.logger.log(`Coins notification for ${mobileNumber}: +${data.coinsReceived} coins (${data.reason})`);
      // Template not yet approved - implement when available
    } catch (error) {
      this.logger.error('Failed to send coins notification', error);
    }
  }

  /**
   * Referral success notification
   * Note: No approved template yet - logs only
   */
  async sendReferralSuccessNotification(
    mobileNumber: string,
    data: {
      userName: string;
      referredName: string;
      coinsEarned: number;
      newBalance: number;
    },
  ): Promise<void> {
    try {
      this.logger.log(`Referral notification for ${mobileNumber}: +${data.coinsEarned} coins`);
      // Template not yet approved - implement when available
    } catch (error) {
      this.logger.error('Failed to send referral notification', error);
    }
  }
}

