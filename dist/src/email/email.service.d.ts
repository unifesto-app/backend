import { ConfigService } from '@nestjs/config';
interface RegistrationConfirmationData {
    email: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    venueName?: string;
    city?: string;
    isOnline: boolean;
    onlineUrl?: string;
    qrCode: string;
    ticketCode?: string;
}
interface PaymentConfirmationData {
    email: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    venueName?: string;
    city?: string;
    isOnline: boolean;
    onlineUrl?: string;
    amount: number;
    processingFee: number;
    coinsUsed?: number;
    coinValueINR?: number;
    razorpayPaymentId: string;
    ticketCode?: string;
    qrCode: string;
}
interface CancellationConfirmationData {
    email: string;
    userName: string;
    eventTitle: string;
    coinsRefunded?: number;
    razorpayRefundInitiated?: boolean;
    razorpayRefundAmount?: number;
}
interface SpaceApprovedData {
    email: string;
    organizerName: string;
    spaceName: string;
    spaceSlug: string;
}
interface SpaceRejectedData {
    email: string;
    organizerName: string;
    spaceName: string;
    rejectionReason: string;
}
interface NewSpaceSubmittedData {
    adminEmail: string;
    spaceName: string;
    organizerName: string;
    organizerMobile: string;
    spaceDescription?: string;
    submittedAt: string;
}
interface CheckinConfirmationData {
    email: string;
    userName: string;
    eventTitle: string;
    checkedInAt: string;
    coinsAwarded: number;
}
interface EventReminderData {
    email: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    venueName?: string;
    city?: string;
    isOnline: boolean;
    onlineUrl?: string;
    qrCode: string;
    ticketCode?: string;
}
interface ReferralSuccessData {
    email: string;
    referrerName: string;
    referredName: string;
    coinsEarned: number;
    newBalance: number;
}
interface PasswordlessLoginLinkData {
    email: string;
    userName: string;
    loginLink: string;
    expiresInMinutes: number;
}
interface AccountDeactivatedData {
    email: string;
    userName: string;
    reason?: string;
}
interface EmailVerificationData {
    email: string;
    userName: string;
    verificationLink: string;
}
interface AccountSuspendedData {
    email: string;
    userName: string;
    reason: string;
    suspendedUntil?: string;
}
interface AccountReactivatedData {
    email: string;
    userName: string;
}
interface NewDeviceLoginData {
    email: string;
    userName: string;
    device: string;
    location: string;
    time: string;
    loginLink: string;
}
interface SuspiciousActivityData {
    email: string;
    userName: string;
    activityDescription: string;
    time: string;
}
interface EventCancelledData {
    email: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    cancellationReason?: string;
    refundInfo?: string;
}
interface EventUpdatedData {
    email: string;
    userName: string;
    eventTitle: string;
    changes: {
        field: string;
        oldValue: string;
        newValue: string;
    }[];
    newDate?: string;
    newTime?: string;
    newVenue?: string;
}
interface EventPublishedData {
    email: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    venueName?: string;
    city?: string;
    isOnline: boolean;
    spaceName: string;
    registrationUrl: string;
}
interface WaitlistConfirmationData {
    email: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    waitlistPosition: number;
}
interface WaitlistPromotedData {
    email: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    venueName?: string;
    city?: string;
    isOnline: boolean;
    onlineUrl?: string;
    registrationUrl: string;
    expiresInHours: number;
}
interface EventSummaryData {
    email: string;
    userName: string;
    eventTitle: string;
    attendeeCount: number;
    coinsAwarded: number;
    photosUrl?: string;
}
interface EventStartingSoonData {
    email: string;
    userName: string;
    eventTitle: string;
    startsInMinutes: number;
    venueName?: string;
    city?: string;
    isOnline: boolean;
    onlineUrl?: string;
    qrCode: string;
}
interface SpeakerInvitationData {
    email: string;
    speakerName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    organizerName: string;
    acceptUrl: string;
    declineUrl: string;
}
interface SpaceMemberJoinedData {
    email: string;
    organizerName: string;
    spaceName: string;
    memberName: string;
    totalMembers: number;
}
interface CoOrganizerInvitedData {
    email: string;
    inviteeName: string;
    spaceName: string;
    inviterName: string;
    acceptUrl: string;
}
interface CoOrganizerRemovedData {
    email: string;
    userName: string;
    spaceName: string;
}
interface ParentSpaceRequestSubmittedData {
    email: string;
    organizerName: string;
    spaceName: string;
    parentSpaceName: string;
}
interface ParentSpaceRequestApprovedData {
    email: string;
    organizerName: string;
    spaceName: string;
    parentSpaceName: string;
}
interface ParentSpaceRequestRejectedData {
    email: string;
    organizerName: string;
    spaceName: string;
    parentSpaceName: string;
    reason?: string;
}
interface SpaceSuspendedData {
    email: string;
    organizerName: string;
    spaceName: string;
    reason: string;
}
interface SpaceArchivedData {
    email: string;
    organizerName: string;
    spaceName: string;
}
interface PaymentFailedData {
    email: string;
    userName: string;
    eventTitle: string;
    amount: number;
    reason?: string;
    retryUrl: string;
}
interface RedeemCodeUsedData {
    email: string;
    userName: string;
    code: string;
    coinsReceived: number;
    newBalance: number;
}
interface AdminCoinGrantData {
    email: string;
    userName: string;
    coinsGranted: number;
    reason: string;
    newBalance: number;
}
interface PartnerCoinCreditData {
    email: string;
    userName: string;
    partnerName: string;
    coinsReceived: number;
    newBalance: number;
}
interface LowBalanceAlertData {
    email: string;
    userName: string;
    currentBalance: number;
    threshold: number;
}
interface RefundProcessedData {
    email: string;
    userName: string;
    eventTitle: string;
    refundAmount: number;
    paymentId: string;
    processingDays: number;
}
interface SubscriptionActivatedData {
    email: string;
    userName: string;
    plan: string;
    billingCycle: string;
    amount: number;
    expiresAt?: string;
    features: string[];
}
interface SubscriptionCancelledData {
    email: string;
    userName: string;
    plan: string;
    expiresAt: string;
}
interface SubscriptionExpiringData {
    email: string;
    userName: string;
    plan: string;
    expiresAt: string;
    renewUrl: string;
}
interface SubscriptionExpiredData {
    email: string;
    userName: string;
    plan: string;
    downgradedTo: string;
}
interface SubscriptionUpgradedData {
    email: string;
    userName: string;
    fromPlan: string;
    toPlan: string;
    newFeatures: string[];
}
interface SubscriptionDowngradedData {
    email: string;
    userName: string;
    fromPlan: string;
    toPlan: string;
}
interface InvoiceData {
    email: string;
    userName: string;
    invoiceNumber: string;
    plan: string;
    amount: number;
    billingDate: string;
    billingCycle: string;
    paymentId: string;
}
interface ReferralCodeReminderData {
    email: string;
    userName: string;
    referralCode: string;
    totalReferred: number;
    coinsEarned: number;
    shareUrl: string;
}
interface ReferralMilestoneData {
    email: string;
    userName: string;
    milestone: number;
    bonusCoins: number;
    totalCoinsEarned: number;
}
interface DailyAdminDigestData {
    adminEmail: string;
    date: string;
    newUsers: number;
    newSpaces: number;
    newEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
    activeUsers: number;
}
interface WeeklyReportData {
    adminEmail: string;
    weekStarting: string;
    metrics: {
        label: string;
        value: string;
        change: string;
    }[];
}
interface MonthlyInvoiceSummaryData {
    adminEmail: string;
    month: string;
    totalRevenue: number;
    totalTransactions: number;
    topEvents: {
        title: string;
        revenue: number;
    }[];
}
interface CustomCampaignData {
    to: string | string[];
    subject: string;
    html: string;
    campaignId: string;
}
interface BankAccountRejectedData {
    email: string;
    userName: string;
    bankName: string;
    accountNumber: string;
    rejectionReason: string;
}
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private readonly resend;
    private readonly sesClient;
    private readonly fromTransactional;
    private readonly fromBulk;
    constructor(configService: ConfigService);
    sendRawEmail(to: string, subject: string, html: string): Promise<string | null>;
    sendBankAccountRejected(data: BankAccountRejectedData): Promise<void>;
    protected sendViaResend(to: string, subject: string, html: string): Promise<string | null>;
    private sendViaSES;
    sendOtpEmail(email: string, otp: string): Promise<void>;
    sendWelcomeEmail(email: string, userName: string): Promise<void>;
    sendRegistrationConfirmation(data: RegistrationConfirmationData): Promise<void>;
    sendPaymentConfirmation(data: PaymentConfirmationData): Promise<void>;
    sendCancellationConfirmation(data: CancellationConfirmationData): Promise<void>;
    sendSpaceApproved(data: SpaceApprovedData): Promise<void>;
    sendSpaceRejected(data: SpaceRejectedData): Promise<void>;
    sendNewSpaceSubmittedToAdmin(data: NewSpaceSubmittedData): Promise<void>;
    sendCheckinConfirmation(data: CheckinConfirmationData): Promise<void>;
    sendEventReminder(data: EventReminderData): Promise<void>;
    sendReferralSuccess(data: ReferralSuccessData): Promise<void>;
    sendPasswordlessLoginLink(data: PasswordlessLoginLinkData): Promise<void>;
    sendAccountDeactivated(data: AccountDeactivatedData): Promise<void>;
    sendEmailVerification(data: EmailVerificationData): Promise<void>;
    sendAccountSuspended(data: AccountSuspendedData): Promise<void>;
    sendAccountReactivated(data: AccountReactivatedData): Promise<void>;
    sendNewDeviceLogin(data: NewDeviceLoginData): Promise<void>;
    sendSuspiciousActivity(data: SuspiciousActivityData): Promise<void>;
    sendEventCancelled(data: EventCancelledData): Promise<void>;
    sendEventUpdated(data: EventUpdatedData): Promise<void>;
    sendEventPublished(data: EventPublishedData): Promise<void>;
    sendWaitlistConfirmation(data: WaitlistConfirmationData): Promise<void>;
    sendWaitlistPromoted(data: WaitlistPromotedData): Promise<void>;
    sendEventSummary(data: EventSummaryData): Promise<void>;
    sendEventStartingSoon(data: EventStartingSoonData): Promise<void>;
    sendSpeakerInvitation(data: SpeakerInvitationData): Promise<void>;
    sendSpaceMemberJoined(data: SpaceMemberJoinedData): Promise<void>;
    sendCoOrganizerInvited(data: CoOrganizerInvitedData): Promise<void>;
    sendCoOrganizerRemoved(data: CoOrganizerRemovedData): Promise<void>;
    sendParentSpaceRequestSubmitted(data: ParentSpaceRequestSubmittedData): Promise<void>;
    sendParentSpaceRequestApproved(data: ParentSpaceRequestApprovedData): Promise<void>;
    sendParentSpaceRequestRejected(data: ParentSpaceRequestRejectedData): Promise<void>;
    sendSpaceSuspended(data: SpaceSuspendedData): Promise<void>;
    sendSpaceArchived(data: SpaceArchivedData): Promise<void>;
    sendPaymentFailed(data: PaymentFailedData): Promise<void>;
    sendRedeemCodeUsed(data: RedeemCodeUsedData): Promise<void>;
    sendAdminCoinGrant(data: AdminCoinGrantData): Promise<void>;
    sendPartnerCoinCredit(data: PartnerCoinCreditData): Promise<void>;
    sendLowBalanceAlert(data: LowBalanceAlertData): Promise<void>;
    sendRefundProcessed(data: RefundProcessedData): Promise<void>;
    sendSubscriptionActivated(data: SubscriptionActivatedData): Promise<void>;
    sendSubscriptionCancelled(data: SubscriptionCancelledData): Promise<void>;
    sendSubscriptionExpiring(data: SubscriptionExpiringData): Promise<void>;
    sendSubscriptionExpired(data: SubscriptionExpiredData): Promise<void>;
    sendSubscriptionUpgraded(data: SubscriptionUpgradedData): Promise<void>;
    sendSubscriptionDowngraded(data: SubscriptionDowngradedData): Promise<void>;
    sendInvoice(data: InvoiceData): Promise<void>;
    sendReferralCodeReminder(data: ReferralCodeReminderData): Promise<void>;
    sendReferralMilestone(data: ReferralMilestoneData): Promise<void>;
    sendDailyAdminDigest(data: DailyAdminDigestData): Promise<void>;
    sendWeeklyReport(data: WeeklyReportData): Promise<void>;
    sendMonthlyInvoiceSummary(data: MonthlyInvoiceSummaryData): Promise<void>;
    sendCustomCampaignEmail(data: CustomCampaignData): Promise<{
        messageId: string | null;
        error?: string;
    }>;
    private emailWrapper;
    private logoHeader;
    private footer;
    private ctaButton;
    private accentBox;
    private coinsBox;
    private eventDetailsCard;
    private getOtpEmailTemplate;
    private getWelcomeEmailTemplate;
    private getRegistrationConfirmationTemplate;
    private getPaymentConfirmationTemplate;
    private getCancellationConfirmationTemplate;
    private getSpaceApprovedTemplate;
    private getSpaceRejectedTemplate;
    private getNewSpaceSubmittedTemplate;
    private getCheckinConfirmationTemplate;
    private getEventReminderTemplate;
    private getReferralSuccessTemplate;
    private getPasswordlessLoginLinkTemplate;
    private getAccountDeactivatedTemplate;
    private getEmailVerificationTemplate;
    private getAccountSuspendedTemplate;
    private getAccountReactivatedTemplate;
    private getNewDeviceLoginTemplate;
    private getSuspiciousActivityTemplate;
    private getEventCancelledTemplate;
    private getEventUpdatedTemplate;
    private getEventPublishedTemplate;
    private getWaitlistConfirmationTemplate;
    private getWaitlistPromotedTemplate;
    private getEventSummaryTemplate;
    private getEventStartingSoonTemplate;
    private getSpeakerInvitationTemplate;
    private getSpaceMemberJoinedTemplate;
    private getCoOrganizerInvitedTemplate;
    private getCoOrganizerRemovedTemplate;
    private getParentSpaceRequestSubmittedTemplate;
    private getParentSpaceRequestApprovedTemplate;
    private getParentSpaceRequestRejectedTemplate;
    private getSpaceSuspendedTemplate;
    private getSpaceArchivedTemplate;
    private getPaymentFailedTemplate;
    private getRedeemCodeUsedTemplate;
    private getAdminCoinGrantTemplate;
    private getPartnerCoinCreditTemplate;
    private getLowBalanceAlertTemplate;
    private getRefundProcessedTemplate;
    private getSubscriptionActivatedTemplate;
    private getSubscriptionCancelledTemplate;
    private getSubscriptionExpiringTemplate;
    private getSubscriptionExpiredTemplate;
    private getSubscriptionUpgradedTemplate;
    private getSubscriptionDowngradedTemplate;
    private getInvoiceTemplate;
    private getReferralCodeReminderTemplate;
    private getReferralMilestoneTemplate;
    private getDailyAdminDigestTemplate;
    private getWeeklyReportTemplate;
    private getMonthlyInvoiceSummaryTemplate;
}
export {};
