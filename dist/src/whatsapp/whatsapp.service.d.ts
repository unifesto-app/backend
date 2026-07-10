import { ConfigService } from '@nestjs/config';
export declare class WhatsAppService {
    private readonly configService;
    private readonly logger;
    private readonly phoneNumberId;
    private readonly accessToken;
    private readonly apiUrl;
    constructor(configService: ConfigService);
    private formatPhoneNumber;
    private formatEventDate;
    private formatEventTime;
    private formatVenue;
    private sendTemplateMessage;
    sendOtp(phoneNumber: string, otp: string): Promise<void>;
    sendWelcomeMessage(phoneNumber: string, username: string): Promise<void>;
    verifyWebhookSignature(signature: string, payload: string): boolean;
    isConfigured(): boolean;
    verifyWebhookChallenge(mode: string | undefined, token: string | undefined, challenge: string | undefined): string | null;
    handleWebhookPayload(body: any): void;
    sendRegistrationConfirmation(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        eventDate: string;
        eventTime: string;
        venueName?: string;
        city?: string;
        isOnline: boolean;
        onlineUrl?: string;
    }): Promise<void>;
    sendEventReminder(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        eventDate: string;
        eventTime: string;
        venueName?: string;
        city?: string;
        isOnline: boolean;
        onlineUrl?: string;
    }): Promise<void>;
    sendRegistrationCancelled(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        coinsRefunded?: number;
        razorpayRefundInitiated?: boolean;
    }): Promise<void>;
    sendSpaceApproved(mobileNumber: string, data: {
        organizerName: string;
        spaceName: string;
    }): Promise<void>;
    sendSpaceRejected(mobileNumber: string, data: {
        organizerName: string;
        spaceName: string;
        rejectionReason: string;
    }): Promise<void>;
    sendCheckinConfirmed(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        coinsAwarded: number;
    }): Promise<void>;
    sendPaymentConfirmed(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        amount: number;
        coinsUsed?: number;
    }): Promise<void>;
    sendNewSpaceSubmitted(adminMobileNumber: string, data: {
        spaceName: string;
        organizerName: string;
    }): Promise<void>;
    sendCancellationNotification(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        coinsRefunded?: number;
        razorpayRefundInitiated?: boolean;
    }): Promise<void>;
    sendSpaceApprovedNotification(mobileNumber: string, data: {
        userName: string;
        spaceName: string;
        spaceSlug: string;
    }): Promise<void>;
    sendSpaceRejectedNotification(mobileNumber: string, data: {
        userName: string;
        spaceName: string;
        rejectionReason?: string;
    }): Promise<void>;
    sendCheckinConfirmation(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        coinsAwarded: number;
    }): Promise<void>;
    sendPaymentConfirmation(mobileNumber: string, data: {
        userName: string;
        eventTitle: string;
        amount: number;
        coinsUsed?: number;
        ticketCode: string;
    }): Promise<void>;
    sendNewSpaceSubmittedNotification(adminMobileNumber: string, data: {
        spaceName: string;
        organiserName: string;
        spaceSlug: string;
    }): Promise<void>;
    sendCoinsReceivedNotification(mobileNumber: string, data: {
        userName: string;
        coinsReceived: number;
        newBalance: number;
        reason: string;
    }): Promise<void>;
    sendReferralSuccessNotification(mobileNumber: string, data: {
        userName: string;
        referredName: string;
        coinsEarned: number;
        newBalance: number;
    }): Promise<void>;
}
