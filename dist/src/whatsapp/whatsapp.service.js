"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const TEMPLATES = {
    OTP: 'otp',
    EVENT_REGISTRATION: 'event_registration_confirmation',
    EVENT_REMINDER: 'event_reminder_24h',
    REGISTRATION_CANCELLED: 'registration_cancelled',
    SPACE_APPROVED: 'space_approved',
    SPACE_REJECTED: 'space_rejected',
    CHECKIN_CONFIRMED: 'checkin_confirmed',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    NEW_SPACE_SUBMITTED: 'new_space_submitted',
};
const HEADER_IMAGES = {
    EVENT_REGISTRATION: 'https://unifesto-storage-bucket.s3.ap-south-1.amazonaws.com/whatsapp-headers/registration_confirmed.png',
    SPACE_APPROVED: 'https://unifesto-storage-bucket.s3.ap-south-1.amazonaws.com/whatsapp-headers/space_approved.png',
    CHECKIN_CONFIRMED: 'https://unifesto-storage-bucket.s3.ap-south-1.amazonaws.com/whatsapp-headers/checkin.png',
};
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    configService;
    logger = new common_1.Logger(WhatsAppService_1.name);
    phoneNumberId;
    accessToken;
    apiUrl;
    constructor(configService) {
        this.configService = configService;
        this.phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
        this.accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
        this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
        if (!this.phoneNumberId || !this.accessToken) {
            this.logger.warn('WhatsApp credentials not configured. WhatsApp notifications will not work.');
        }
    }
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber)
            return '';
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');
        if (!cleaned.startsWith('+')) {
            cleaned = '+91' + cleaned.replace(/^0+/, '');
        }
        return cleaned;
    }
    formatEventDate(dateTime, timezone = 'Asia/Kolkata') {
        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: timezone,
        }).format(dateTime);
    }
    formatEventTime(startTime, endTime, timezone = 'Asia/Kolkata') {
        const formatTime = (date) => new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone,
        }).format(date);
        return `${formatTime(startTime)} - ${formatTime(endTime)} IST`;
    }
    formatVenue(event) {
        if (event.type === 'ONLINE') {
            return `Online - ${event.onlineUrl || 'Link will be shared'}`;
        }
        else if (event.type === 'HYBRID') {
            const physical = event.venueName && event.city
                ? `${event.venueName}, ${event.city}`
                : 'Venue TBA';
            return `${physical} + Online`;
        }
        else {
            return event.venueName && event.city
                ? `${event.venueName}, ${event.city}`
                : 'Venue TBA';
        }
    }
    async sendTemplateMessage(to, templateName, bodyParameters, hasImageHeader = false, imageUrl) {
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
            const components = [];
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
            components.push({
                type: 'body',
                parameters: bodyParameters.map((text) => ({
                    type: 'text',
                    text,
                })),
            });
            const message = {
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
            const response = await axios_1.default.post(this.apiUrl, message, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const messageId = response.data.messages?.[0]?.id;
            this.logger.log(`WhatsApp template sent: ${templateName} to ${formattedPhone}, ID: ${messageId}`);
        }
        catch (error) {
            if (error.response) {
                this.logger.error(`WhatsApp API error for template ${templateName}`, {
                    status: error.response.status,
                    error: error.response.data?.error,
                    phone: formattedPhone,
                });
            }
            else {
                this.logger.error(`WhatsApp send error for template ${templateName}`, error);
            }
        }
    }
    async sendOtp(phoneNumber, otp) {
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
        }
        catch (error) {
            this.logger.error('Failed to send WhatsApp OTP', error);
        }
    }
    async sendWelcomeMessage(phoneNumber, username) {
        try {
            this.logger.log(`Welcome message skipped for ${phoneNumber} - template not configured`);
        }
        catch (error) {
            this.logger.error('Failed to send welcome message', error);
        }
    }
    verifyWebhookSignature(signature, payload) {
        const crypto = require('crypto');
        const webhookSecret = this.configService.get('WHATSAPP_WEBHOOK_SECRET');
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
    isConfigured() {
        return !!(this.phoneNumberId && this.accessToken);
    }
    async sendRegistrationConfirmation(mobileNumber, data) {
        try {
            if (!mobileNumber)
                return;
            const venue = this.formatVenue({
                type: data.isOnline ? 'ONLINE' : 'IN_PERSON',
                venueName: data.venueName,
                city: data.city,
                onlineUrl: data.onlineUrl,
            });
            await this.sendTemplateMessage(mobileNumber, TEMPLATES.EVENT_REGISTRATION, [
                data.userName,
                data.eventTitle,
                data.eventDate,
                data.eventTime,
                venue,
            ], true, HEADER_IMAGES.EVENT_REGISTRATION);
        }
        catch (error) {
            this.logger.error('Failed to send registration confirmation', error);
        }
    }
    async sendEventReminder(mobileNumber, data) {
        try {
            if (!mobileNumber)
                return;
            const venue = this.formatVenue({
                type: data.isOnline ? 'ONLINE' : 'IN_PERSON',
                venueName: data.venueName,
                city: data.city,
                onlineUrl: data.onlineUrl,
            });
            await this.sendTemplateMessage(mobileNumber, TEMPLATES.EVENT_REMINDER, [
                data.userName,
                data.eventTitle,
                data.eventDate,
                data.eventTime,
                venue,
            ], false);
        }
        catch (error) {
            this.logger.error('Failed to send event reminder', error);
        }
    }
    async sendRegistrationCancelled(mobileNumber, data) {
        try {
            if (!mobileNumber)
                return;
            let refundInfo = 'No refunds applicable.';
            const refundParts = [];
            if (data.coinsRefunded && data.coinsRefunded > 0) {
                refundParts.push(`${data.coinsRefunded} coins refunded to wallet`);
            }
            if (data.razorpayRefundInitiated) {
                refundParts.push('Payment refund initiated (5-7 business days)');
            }
            if (refundParts.length > 0) {
                refundInfo = refundParts.join('. ');
            }
            await this.sendTemplateMessage(mobileNumber, TEMPLATES.REGISTRATION_CANCELLED, [
                data.userName,
                data.eventTitle,
                refundInfo,
            ], false);
        }
        catch (error) {
            this.logger.error('Failed to send cancellation notification', error);
        }
    }
    async sendSpaceApproved(mobileNumber, data) {
        try {
            if (!mobileNumber)
                return;
            await this.sendTemplateMessage(mobileNumber, TEMPLATES.SPACE_APPROVED, [
                data.organizerName,
                data.spaceName,
            ], true, HEADER_IMAGES.SPACE_APPROVED);
        }
        catch (error) {
            this.logger.error('Failed to send space approved notification', error);
        }
    }
    async sendSpaceRejected(mobileNumber, data) {
        try {
            if (!mobileNumber)
                return;
            await this.sendTemplateMessage(mobileNumber, TEMPLATES.SPACE_REJECTED, [
                data.organizerName,
                data.spaceName,
                data.rejectionReason || 'Not specified',
            ], false);
        }
        catch (error) {
            this.logger.error('Failed to send space rejected notification', error);
        }
    }
    async sendCheckinConfirmed(mobileNumber, data) {
        try {
            if (!mobileNumber)
                return;
            await this.sendTemplateMessage(mobileNumber, TEMPLATES.CHECKIN_CONFIRMED, [
                data.userName,
                data.eventTitle,
                data.coinsAwarded.toString(),
            ], true, HEADER_IMAGES.CHECKIN_CONFIRMED);
        }
        catch (error) {
            this.logger.error('Failed to send check-in confirmation', error);
        }
    }
    async sendPaymentConfirmed(mobileNumber, data) {
        try {
            if (!mobileNumber)
                return;
            const coinsInfo = data.coinsUsed && data.coinsUsed > 0
                ? `${data.coinsUsed} coins used`
                : 'No coins used';
            await this.sendTemplateMessage(mobileNumber, TEMPLATES.PAYMENT_CONFIRMED, [
                data.userName,
                data.eventTitle,
                `₹${data.amount.toFixed(2)}`,
                coinsInfo,
            ], false);
        }
        catch (error) {
            this.logger.error('Failed to send payment confirmation', error);
        }
    }
    async sendNewSpaceSubmitted(adminMobileNumber, data) {
        try {
            if (!adminMobileNumber)
                return;
            await this.sendTemplateMessage(adminMobileNumber, TEMPLATES.NEW_SPACE_SUBMITTED, [
                data.spaceName,
                data.organizerName,
            ], false);
        }
        catch (error) {
            this.logger.error('Failed to send new space notification', error);
        }
    }
    async sendCancellationNotification(mobileNumber, data) {
        return this.sendRegistrationCancelled(mobileNumber, data);
    }
    async sendSpaceApprovedNotification(mobileNumber, data) {
        return this.sendSpaceApproved(mobileNumber, {
            organizerName: data.userName,
            spaceName: data.spaceName,
        });
    }
    async sendSpaceRejectedNotification(mobileNumber, data) {
        return this.sendSpaceRejected(mobileNumber, {
            organizerName: data.userName,
            spaceName: data.spaceName,
            rejectionReason: data.rejectionReason || 'Not specified',
        });
    }
    async sendCheckinConfirmation(mobileNumber, data) {
        return this.sendCheckinConfirmed(mobileNumber, data);
    }
    async sendPaymentConfirmation(mobileNumber, data) {
        return this.sendPaymentConfirmed(mobileNumber, {
            userName: data.userName,
            eventTitle: data.eventTitle,
            amount: data.amount,
            coinsUsed: data.coinsUsed,
        });
    }
    async sendNewSpaceSubmittedNotification(adminMobileNumber, data) {
        return this.sendNewSpaceSubmitted(adminMobileNumber, {
            spaceName: data.spaceName,
            organizerName: data.organiserName,
        });
    }
    async sendCoinsReceivedNotification(mobileNumber, data) {
        try {
            this.logger.log(`Coins notification for ${mobileNumber}: +${data.coinsReceived} coins (${data.reason})`);
        }
        catch (error) {
            this.logger.error('Failed to send coins notification', error);
        }
    }
    async sendReferralSuccessNotification(mobileNumber, data) {
        try {
            this.logger.log(`Referral notification for ${mobileNumber}: +${data.coinsEarned} coins`);
        }
        catch (error) {
            this.logger.error('Failed to send referral notification', error);
        }
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map