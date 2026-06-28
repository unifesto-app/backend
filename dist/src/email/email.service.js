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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
const client_ses_1 = require("@aws-sdk/client-ses");
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    resend;
    sesClient;
    fromTransactional;
    fromBulk;
    constructor(configService) {
        this.configService = configService;
        const resendApiKey = this.configService.get('RESEND_API_KEY');
        if (!resendApiKey) {
            this.logger.warn('RESEND_API_KEY not configured. Transactional emails will not work.');
        }
        this.resend = new resend_1.Resend(resendApiKey);
        const transactionalAddress = this.configService.get('EMAIL_FROM_TRANSACTIONAL', 'no-reply@notify.unifesto.app');
        this.fromTransactional = `Unifesto <${transactionalAddress}>`;
        const sesRegion = this.configService.get('AWS_SES_REGION', 'ap-south-1');
        this.sesClient = new client_ses_1.SESClient({ region: sesRegion });
        const bulkAddress = this.configService.get('EMAIL_FROM_BULK', 'no-reply@updates.unifesto.app');
        this.fromBulk = `Unifesto <${bulkAddress}>`;
    }
    async sendRawEmail(to, subject, html) {
        return this.sendViaResend(to, subject, html);
    }
    async sendBankAccountRejected(data) {
        try {
            await this.sendViaResend(data.email, 'Bank account verification failed — Unifesto', `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#dc2626">Bank Account Verification Failed</h2>
            <p>Hi ${data.userName},</p>
            <p>Unfortunately, we were unable to verify your bank account ending in <strong>****${data.accountNumber}</strong> at <strong>${data.bankName}</strong>.</p>
            <p><strong>Reason:</strong> ${data.rejectionReason}</p>
            <p>Please update your bank account details in the Forge dashboard and resubmit for verification.</p>
            <a href="https://forge.unifesto.app/dashboard/payouts" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px">Update Bank Account</a>
            <p style="margin-top:24px;color:#6b7280;font-size:14px">If you have questions, contact us at support@unifesto.app</p>
          </div>
        `);
        }
        catch (error) {
            this.logger.error('Error sending bank account rejected email', error);
        }
    }
    async sendViaResend(to, subject, html) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromTransactional,
                to,
                subject,
                html,
            });
            if (error) {
                this.logger.error(`Resend error: ${error.message}`);
                return null;
            }
            return data?.id || null;
        }
        catch (error) {
            this.logger.error(`Resend exception: ${error.message}`);
            return null;
        }
    }
    async sendViaSES(to, subject, html) {
        try {
            const toAddresses = Array.isArray(to) ? to : [to];
            const command = new client_ses_1.SendEmailCommand({
                Source: this.fromBulk,
                Destination: { ToAddresses: toAddresses },
                Message: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: { Html: { Data: html, Charset: 'UTF-8' } },
                },
            });
            const result = await this.sesClient.send(command);
            return result.MessageId || null;
        }
        catch (error) {
            this.logger.error(`SES error: ${error.message}`);
            return null;
        }
    }
    async sendOtpEmail(email, otp) {
        if (!email)
            return;
        try {
            const messageId = await this.sendViaResend(email, 'Your Unifesto Login Code', this.getOtpEmailTemplate(otp));
            if (messageId) {
                this.logger.log(`OTP email sent to ${email}, ID: ${messageId}`);
            }
            else {
                this.logger.error(`Failed to send OTP email to ${email}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending OTP email', error);
        }
    }
    async sendWelcomeEmail(email, userName) {
        if (!email)
            return;
        try {
            const messageId = await this.sendViaResend(email, 'Welcome to Unifesto', this.getWelcomeEmailTemplate(userName));
            if (messageId) {
                this.logger.log(`Welcome email sent to ${email}, ID: ${messageId}`);
            }
            else {
                this.logger.error(`Failed to send welcome email to ${email}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending welcome email', error);
        }
    }
    async sendRegistrationConfirmation(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You're registered for ${data.eventTitle}`, this.getRegistrationConfirmationTemplate(data));
            if (messageId) {
                this.logger.log(`Registration confirmation sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending registration confirmation email', error);
        }
    }
    async sendPaymentConfirmation(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Payment confirmed for ${data.eventTitle}`, this.getPaymentConfirmationTemplate(data));
            if (messageId) {
                this.logger.log(`Payment confirmation sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending payment confirmation email', error);
        }
    }
    async sendCancellationConfirmation(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Registration cancelled for ${data.eventTitle}`, this.getCancellationConfirmationTemplate(data));
            if (messageId) {
                this.logger.log(`Cancellation confirmation sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending cancellation confirmation email', error);
        }
    }
    async sendSpaceApproved(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Your space ${data.spaceName} is approved`, this.getSpaceApprovedTemplate(data));
            if (messageId) {
                this.logger.log(`Space approved email sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending space approved email', error);
        }
    }
    async sendSpaceRejected(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Space review update for ${data.spaceName}`, this.getSpaceRejectedTemplate(data));
            if (messageId) {
                this.logger.log(`Space rejected email sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending space rejected email', error);
        }
    }
    async sendNewSpaceSubmittedToAdmin(data) {
        if (!data.adminEmail)
            return;
        try {
            const messageId = await this.sendViaResend(data.adminEmail, `New space submitted: ${data.spaceName}`, this.getNewSpaceSubmittedTemplate(data));
            if (messageId) {
                this.logger.log(`New space submitted notification sent to ${data.adminEmail}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending new space submitted email', error);
        }
    }
    async sendCheckinConfirmation(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You're checked in - ${data.eventTitle}`, this.getCheckinConfirmationTemplate(data));
            if (messageId) {
                this.logger.log(`Checkin confirmation sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending checkin confirmation email', error);
        }
    }
    async sendEventReminder(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Tomorrow: ${data.eventTitle}`, this.getEventReminderTemplate(data));
            if (messageId) {
                this.logger.log(`Event reminder sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending event reminder email', error);
        }
    }
    async sendReferralSuccess(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You earned coins - ${data.referredName} joined Unifesto`, this.getReferralSuccessTemplate(data));
            if (messageId) {
                this.logger.log(`Referral success email sent to ${data.email}, ID: ${messageId}`);
            }
        }
        catch (error) {
            this.logger.error('Error sending referral success email', error);
        }
    }
    async sendPasswordlessLoginLink(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Your Unifesto login link', this.getPasswordlessLoginLinkTemplate(data));
            if (messageId)
                this.logger.log(`Passwordless login link sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending passwordless login link', error);
        }
    }
    async sendAccountDeactivated(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Your Unifesto account has been deactivated', this.getAccountDeactivatedTemplate(data));
            if (messageId)
                this.logger.log(`Account deactivated email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending account deactivated email', error);
        }
    }
    async sendEmailVerification(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Verify your email address', this.getEmailVerificationTemplate(data));
            if (messageId)
                this.logger.log(`Email verification sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending email verification', error);
        }
    }
    async sendAccountSuspended(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Your account has been temporarily suspended', this.getAccountSuspendedTemplate(data));
            if (messageId)
                this.logger.log(`Account suspended email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending account suspended email', error);
        }
    }
    async sendAccountReactivated(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Your account has been reactivated', this.getAccountReactivatedTemplate(data));
            if (messageId)
                this.logger.log(`Account reactivated email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending account reactivated email', error);
        }
    }
    async sendNewDeviceLogin(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'New login detected on your Unifesto account', this.getNewDeviceLoginTemplate(data));
            if (messageId)
                this.logger.log(`New device login email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending new device login email', error);
        }
    }
    async sendSuspiciousActivity(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Suspicious activity detected on your account', this.getSuspiciousActivityTemplate(data));
            if (messageId)
                this.logger.log(`Suspicious activity email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending suspicious activity email', error);
        }
    }
    async sendEventCancelled(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Event cancelled: ${data.eventTitle}`, this.getEventCancelledTemplate(data));
            if (messageId)
                this.logger.log(`Event cancelled email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending event cancelled email', error);
        }
    }
    async sendEventUpdated(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Event details updated: ${data.eventTitle}`, this.getEventUpdatedTemplate(data));
            if (messageId)
                this.logger.log(`Event updated email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending event updated email', error);
        }
    }
    async sendEventPublished(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `New event in ${data.spaceName}: ${data.eventTitle}`, this.getEventPublishedTemplate(data));
            if (messageId)
                this.logger.log(`Event published email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending event published email', error);
        }
    }
    async sendWaitlistConfirmation(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You're on the waitlist for ${data.eventTitle}`, this.getWaitlistConfirmationTemplate(data));
            if (messageId)
                this.logger.log(`Waitlist confirmation sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending waitlist confirmation', error);
        }
    }
    async sendWaitlistPromoted(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `A spot opened up for ${data.eventTitle}`, this.getWaitlistPromotedTemplate(data));
            if (messageId)
                this.logger.log(`Waitlist promoted email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending waitlist promoted email', error);
        }
    }
    async sendEventSummary(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Thanks for attending ${data.eventTitle}`, this.getEventSummaryTemplate(data));
            if (messageId)
                this.logger.log(`Event summary sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending event summary', error);
        }
    }
    async sendEventStartingSoon(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Starting in 1 hour: ${data.eventTitle}`, this.getEventStartingSoonTemplate(data));
            if (messageId)
                this.logger.log(`Event starting soon sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending event starting soon', error);
        }
    }
    async sendSpeakerInvitation(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You're invited to speak at ${data.eventTitle}`, this.getSpeakerInvitationTemplate(data));
            if (messageId)
                this.logger.log(`Speaker invitation sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending speaker invitation', error);
        }
    }
    async sendSpaceMemberJoined(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `${data.memberName} joined your space`, this.getSpaceMemberJoinedTemplate(data));
            if (messageId)
                this.logger.log(`Space member joined email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending space member joined email', error);
        }
    }
    async sendCoOrganizerInvited(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You've been invited as co-organiser of ${data.spaceName}`, this.getCoOrganizerInvitedTemplate(data));
            if (messageId)
                this.logger.log(`Co-organizer invited email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending co-organizer invited email', error);
        }
    }
    async sendCoOrganizerRemoved(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You've been removed as co-organiser of ${data.spaceName}`, this.getCoOrganizerRemovedTemplate(data));
            if (messageId)
                this.logger.log(`Co-organizer removed email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending co-organizer removed email', error);
        }
    }
    async sendParentSpaceRequestSubmitted(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `${data.spaceName} requested to join your space`, this.getParentSpaceRequestSubmittedTemplate(data));
            if (messageId)
                this.logger.log(`Parent space request submitted email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending parent space request submitted email', error);
        }
    }
    async sendParentSpaceRequestApproved(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Your request to join ${data.parentSpaceName} was approved`, this.getParentSpaceRequestApprovedTemplate(data));
            if (messageId)
                this.logger.log(`Parent space request approved email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending parent space request approved email', error);
        }
    }
    async sendParentSpaceRequestRejected(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Update on your request to join ${data.parentSpaceName}`, this.getParentSpaceRequestRejectedTemplate(data));
            if (messageId)
                this.logger.log(`Parent space request rejected email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending parent space request rejected email', error);
        }
    }
    async sendSpaceSuspended(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Your space ${data.spaceName} has been suspended`, this.getSpaceSuspendedTemplate(data));
            if (messageId)
                this.logger.log(`Space suspended email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending space suspended email', error);
        }
    }
    async sendSpaceArchived(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Your space ${data.spaceName} has been archived`, this.getSpaceArchivedTemplate(data));
            if (messageId)
                this.logger.log(`Space archived email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending space archived email', error);
        }
    }
    async sendPaymentFailed(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Payment failed for ${data.eventTitle}`, this.getPaymentFailedTemplate(data));
            if (messageId)
                this.logger.log(`Payment failed email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending payment failed email', error);
        }
    }
    async sendRedeemCodeUsed(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Coins added to your wallet', this.getRedeemCodeUsedTemplate(data));
            if (messageId)
                this.logger.log(`Redeem code used email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending redeem code used email', error);
        }
    }
    async sendAdminCoinGrant(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Coins added to your wallet by Unifesto', this.getAdminCoinGrantTemplate(data));
            if (messageId)
                this.logger.log(`Admin coin grant email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending admin coin grant email', error);
        }
    }
    async sendPartnerCoinCredit(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Coins received from ${data.partnerName}`, this.getPartnerCoinCreditTemplate(data));
            if (messageId)
                this.logger.log(`Partner coin credit email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending partner coin credit email', error);
        }
    }
    async sendLowBalanceAlert(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Your Pocket Coins balance is running low', this.getLowBalanceAlertTemplate(data));
            if (messageId)
                this.logger.log(`Low balance alert sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending low balance alert', error);
        }
    }
    async sendRefundProcessed(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Refund processed for ${data.eventTitle}`, this.getRefundProcessedTemplate(data));
            if (messageId)
                this.logger.log(`Refund processed email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending refund processed email', error);
        }
    }
    async sendSubscriptionActivated(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Welcome to Unifesto ${data.plan} plan`, this.getSubscriptionActivatedTemplate(data));
            if (messageId)
                this.logger.log(`Subscription activated email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending subscription activated email', error);
        }
    }
    async sendSubscriptionCancelled(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Your ${data.plan} subscription has been cancelled`, this.getSubscriptionCancelledTemplate(data));
            if (messageId)
                this.logger.log(`Subscription cancelled email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending subscription cancelled email', error);
        }
    }
    async sendSubscriptionExpiring(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaSES(data.email, `Your ${data.plan} plan expires in 7 days`, this.getSubscriptionExpiringTemplate(data));
            if (messageId)
                this.logger.log(`Subscription expiring email sent to ${data.email} via SES`);
        }
        catch (error) {
            this.logger.error('Error sending subscription expiring email', error);
        }
    }
    async sendSubscriptionExpired(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Your ${data.plan} subscription has expired`, this.getSubscriptionExpiredTemplate(data));
            if (messageId)
                this.logger.log(`Subscription expired email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending subscription expired email', error);
        }
    }
    async sendSubscriptionUpgraded(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You've upgraded to ${data.toPlan}`, this.getSubscriptionUpgradedTemplate(data));
            if (messageId)
                this.logger.log(`Subscription upgraded email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending subscription upgraded email', error);
        }
    }
    async sendSubscriptionDowngraded(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Your plan has been changed to ${data.toPlan}`, this.getSubscriptionDowngradedTemplate(data));
            if (messageId)
                this.logger.log(`Subscription downgraded email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending subscription downgraded email', error);
        }
    }
    async sendInvoice(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `Invoice #${data.invoiceNumber} from Unifesto`, this.getInvoiceTemplate(data));
            if (messageId)
                this.logger.log(`Invoice sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending invoice', error);
        }
    }
    async sendReferralCodeReminder(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, 'Share your referral code and earn coins', this.getReferralCodeReminderTemplate(data));
            if (messageId)
                this.logger.log(`Referral code reminder sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending referral code reminder', error);
        }
    }
    async sendReferralMilestone(data) {
        if (!data.email)
            return;
        try {
            const messageId = await this.sendViaResend(data.email, `You've referred ${data.milestone} people - bonus coins`, this.getReferralMilestoneTemplate(data));
            if (messageId)
                this.logger.log(`Referral milestone email sent to ${data.email}`);
        }
        catch (error) {
            this.logger.error('Error sending referral milestone email', error);
        }
    }
    async sendDailyAdminDigest(data) {
        if (!data.adminEmail)
            return;
        try {
            const messageId = await this.sendViaSES(data.adminEmail, `Unifesto Daily Digest - ${data.date}`, this.getDailyAdminDigestTemplate(data));
            if (messageId)
                this.logger.log(`Daily admin digest sent via SES, ID: ${messageId}`);
        }
        catch (error) {
            this.logger.error('Error sending daily admin digest', error);
        }
    }
    async sendWeeklyReport(data) {
        if (!data.adminEmail)
            return;
        try {
            const messageId = await this.sendViaSES(data.adminEmail, `Weekly Report - Week of ${data.weekStarting}`, this.getWeeklyReportTemplate(data));
            if (messageId)
                this.logger.log(`Weekly report sent via SES, ID: ${messageId}`);
        }
        catch (error) {
            this.logger.error('Error sending weekly report', error);
        }
    }
    async sendMonthlyInvoiceSummary(data) {
        if (!data.adminEmail)
            return;
        try {
            const messageId = await this.sendViaSES(data.adminEmail, `Monthly Revenue Summary - ${data.month}`, this.getMonthlyInvoiceSummaryTemplate(data));
            if (messageId)
                this.logger.log(`Monthly invoice summary sent via SES, ID: ${messageId}`);
        }
        catch (error) {
            this.logger.error('Error sending monthly invoice summary', error);
        }
    }
    async sendCustomCampaignEmail(data) {
        try {
            const messageId = await this.sendViaSES(data.to, data.subject, data.html);
            return { messageId };
        }
        catch (error) {
            this.logger.error(`Error sending custom campaign ${data.campaignId}: ${error.message}`);
            return { messageId: null, error: error.message };
        }
    }
    emailWrapper(content) {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Agrandir:wght@400;600;700&display=swap');
          body { margin: 0; padding: 0; font-family: 'Agrandir', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .gradient-bg { background: linear-gradient(135deg, #3491ff 0%, #0062ff 100%); padding: 40px 20px; text-align: center; }
          .logo { max-width: 180px; height: auto; }
          .content { padding: 40px 30px; color: #1a1a1a; line-height: 1.6; }
          .heading { font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 20px 0; }
          .text { font-size: 16px; color: #4a4a4a; margin: 0 0 16px 0; }
          .cta-button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3491ff 0%, #0062ff 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
          .accent-box { background: #f0f7ff; border-left: 4px solid #3491ff; padding: 16px; margin: 20px 0; border-radius: 4px; }
          .coins-box { background: linear-gradient(135deg, #fff4e6 0%, #ffe4b3 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .coins-amount { font-size: 32px; font-weight: 700; color: #ff9500; }
          .footer { padding: 30px 20px; text-align: center; color: #888; font-size: 14px; background-color: #f9f9f9; }
          .footer a { color: #3491ff; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
          ${this.footer()}
        </div>
      </body>
      </html>
    `;
    }
    logoHeader() {
        const bucketUrl = this.configService.get('S3_BUCKET_URL', 'https://unifesto-storage-bucket.s3.ap-south-1.amazonaws.com');
        const logoUrl = `${bucketUrl}/brand/logo-black.png`;
        return `
      <div class="gradient-bg">
        <img src="${logoUrl}" alt="Unifesto" class="logo" />
      </div>
    `;
    }
    footer() {
        return `
      <div class="footer">
        <p>Unifesto</p>
        <p>
          <a href="https://unifesto.app">Visit Website</a> |
          <a href="https://unifesto.app/privacy">Privacy Policy</a> |
          <a href="https://unifesto.app/terms">Terms of Service</a>
        </p>
        <p>Questions? Reply to this email or contact us at support@unifesto.app</p>
      </div>
    `;
    }
    ctaButton(text, url) {
        return `<a href="${url}" class="cta-button">${text}</a>`;
    }
    accentBox(content) {
        return `<div class="accent-box">${content}</div>`;
    }
    coinsBox(amount, label) {
        return `
      <div class="coins-box">
        <div class="coins-amount">${amount} Pocket Coins</div>
        <p class="text" style="margin-top: 8px;">${label}</p>
      </div>
    `;
    }
    eventDetailsCard(data) {
        const location = data.isOnline
            ? `<p class="text"><strong>Online Event:</strong> <a href="${data.onlineUrl}">${data.onlineUrl}</a></p>`
            : `<p class="text"><strong>Venue:</strong> ${data.venueName}${data.city ? `, ${data.city}` : ''}</p>`;
        return this.accentBox(`
      <p class="text" style="margin: 0 0 8px 0;"><strong>${data.eventTitle}</strong></p>
      <p class="text"><strong>Date:</strong> ${data.eventDate}</p>
      <p class="text"><strong>Time:</strong> ${data.eventTime}</p>
      ${location}
    `);
    }
    getOtpEmailTemplate(otp) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Your Login Code</h1>
        <p class="text">Hi there,</p>
        <p class="text">Use this code to log in to your Unifesto account:</p>
        ${this.accentBox(`<p style="font-size: 32px; font-weight: 700; color: #3491ff; text-align: center; margin: 0;">${otp}</p>`)}
        <p class="text">This code expires in 10 minutes. Don't share it with anyone.</p>
        <p class="text">If you didn't request this code, please ignore this email.</p>
      </div>
    `);
    }
    getWelcomeEmailTemplate(userName) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Welcome to Unifesto, ${userName}</h1>
        <p class="text">We're excited to have you here. Unifesto connects you with communities, events, and experiences that matter.</p>
        <p class="text">Here's what you can do:</p>
        <ul class="text">
          <li>Discover local events and communities</li>
          <li>RSVP to events and meet like-minded people</li>
          <li>Earn Pocket Coins for attending events</li>
          <li>Create your own space and host events</li>
        </ul>
        ${this.ctaButton('Explore Events', 'https://unifesto.app/events')}
        <p class="text">Have questions? We're here to help.</p>
      </div>
    `);
    }
    getRegistrationConfirmationTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">You're registered, ${data.userName}</h1>
        <p class="text">Your spot is confirmed for:</p>
        ${this.eventDetailsCard(data)}
        ${data.ticketCode ? this.accentBox(`<p class="text"><strong>Ticket Code:</strong> ${data.ticketCode}</p>`) : ''}
        <p class="text">Show this QR code at check-in:</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}" alt="QR Code" width="200" height="200" style="max-width: 200px;" />
        </div>
        <p class="text">See you there!</p>
      </div>
    `);
    }
    getPaymentConfirmationTemplate(data) {
        const coinsUsedText = data.coinsUsed && data.coinValueINR
            ? `<p class="text">Pocket Coins Used: ${data.coinsUsed} (₹${data.coinValueINR})</p>`
            : '';
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Payment Confirmed</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your payment has been processed successfully.</p>
        ${this.eventDetailsCard(data)}
        ${this.accentBox(`
          <p class="text"><strong>Payment Breakdown:</strong></p>
          <p class="text">Amount Paid: ₹${data.amount}</p>
          <p class="text">Processing Fee: ₹${data.processingFee}</p>
          ${coinsUsedText}
          <p class="text"><strong>Payment ID:</strong> ${data.razorpayPaymentId}</p>
        `)}
        <div style="text-align: center; margin: 20px 0;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}" alt="QR Code" width="200" height="200" style="max-width: 200px;" />
        </div>
        ${data.ticketCode ? `<p class="text">Ticket Code: ${data.ticketCode}</p>` : ''}
        <p class="text">See you at the event!</p>
      </div>
    `);
    }
    getCancellationConfirmationTemplate(data) {
        const refundText = data.razorpayRefundInitiated && data.razorpayRefundAmount
            ? `<p class="text">A refund of ₹${data.razorpayRefundAmount} has been initiated. It will reflect in your account within 5-7 business days.</p>`
            : data.coinsRefunded
                ? `<p class="text">${data.coinsRefunded} Pocket Coins have been refunded to your wallet.</p>`
                : '';
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Registration Cancelled</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your registration for <strong>${data.eventTitle}</strong> has been cancelled.</p>
        ${refundText ? this.accentBox(refundText) : ''}
        <p class="text">You can explore other events and register anytime.</p>
        ${this.ctaButton('Browse Events', 'https://unifesto.app/events')}
      </div>
    `);
    }
    getSpaceApprovedTemplate(data) {
        const spaceUrl = `https://unifesto.app/spaces/${data.spaceSlug}`;
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Your Space is Live</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text">Great news! Your space <strong>${data.spaceName}</strong> has been approved and is now live on Unifesto.</p>
        <p class="text">You can now:</p>
        <ul class="text">
          <li>Create and publish events</li>
          <li>Invite members to join your community</li>
          <li>Grow your audience and host amazing experiences</li>
        </ul>
        ${this.ctaButton('Go to Your Space', spaceUrl)}
        <p class="text">Let's build something great together.</p>
      </div>
    `);
    }
    getSpaceRejectedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Space Review Update</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text">Thank you for submitting <strong>${data.spaceName}</strong>. After review, we're unable to approve it at this time.</p>
        ${this.accentBox(`<p class="text"><strong>Reason:</strong> ${data.rejectionReason}</p>`)}
        <p class="text">You can make changes and resubmit your space. If you have questions, reach out to us at support@unifesto.app.</p>
      </div>
    `);
    }
    getNewSpaceSubmittedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">New Space Submission</h1>
        <p class="text">A new space has been submitted for review.</p>
        ${this.accentBox(`
          <p class="text"><strong>Space Name:</strong> ${data.spaceName}</p>
          <p class="text"><strong>Organiser:</strong> ${data.organizerName}</p>
          <p class="text"><strong>Mobile:</strong> ${data.organizerMobile}</p>
          <p class="text"><strong>Description:</strong> ${data.spaceDescription || 'N/A'}</p>
          <p class="text"><strong>Submitted At:</strong> ${data.submittedAt}</p>
        `)}
        ${this.ctaButton('Review Space', 'https://admin.unifesto.app/spaces/pending')}
      </div>
    `);
    }
    getCheckinConfirmationTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">You're Checked In</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">You've successfully checked in to <strong>${data.eventTitle}</strong> at ${data.checkedInAt}.</p>
        ${this.coinsBox(data.coinsAwarded, 'Coins added to your wallet')}
        <p class="text">Thanks for attending! We hope you have a great experience.</p>
        ${this.ctaButton('View Your Wallet', 'https://unifesto.app/wallet')}
      </div>
    `);
    }
    getEventReminderTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Event Tomorrow</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Just a friendly reminder about your upcoming event:</p>
        ${this.eventDetailsCard(data)}
        <div style="text-align: center; margin: 20px 0;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}" alt="QR Code" width="200" height="200" style="max-width: 200px;" />
        </div>
        ${data.ticketCode ? `<p class="text">Ticket Code: ${data.ticketCode}</p>` : ''}
        <p class="text">See you soon!</p>
      </div>
    `);
    }
    getReferralSuccessTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">You Earned Coins</h1>
        <p class="text">Hi ${data.referrerName},</p>
        <p class="text">Great news! <strong>${data.referredName}</strong> joined Unifesto using your referral code.</p>
        ${this.coinsBox(data.coinsEarned, 'Coins added to your wallet')}
        <p class="text">Your new balance: <strong>${data.newBalance} Pocket Coins</strong></p>
        <p class="text">Keep sharing and earning!</p>
        ${this.ctaButton('Share Your Code', 'https://unifesto.app/referrals')}
      </div>
    `);
    }
    getPasswordlessLoginLinkTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Your Login Link</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Click the button below to log in to your Unifesto account:</p>
        ${this.ctaButton('Log In to Unifesto', data.loginLink)}
        <p class="text">This link expires in ${data.expiresInMinutes} minutes and can only be used once.</p>
        <p class="text">If you didn't request this link, please ignore this email.</p>
      </div>
    `);
    }
    getAccountDeactivatedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Account Deactivated</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your Unifesto account has been deactivated as requested.</p>
        ${data.reason ? this.accentBox(`<p class="text"><strong>Reason:</strong> ${data.reason}</p>`) : ''}
        <p class="text">You can reactivate your account anytime by logging in again. Your data will be preserved.</p>
        <p class="text">We're sorry to see you go. If you have feedback, we'd love to hear it at support@unifesto.app.</p>
      </div>
    `);
    }
    getEmailVerificationTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Verify Your Email</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Please verify your email address to complete your Unifesto account setup.</p>
        ${this.ctaButton('Verify Email', data.verificationLink)}
        <p class="text">If you didn't create a Unifesto account, please ignore this email.</p>
      </div>
    `);
    }
    getAccountSuspendedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Account Temporarily Suspended</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your Unifesto account has been temporarily suspended.</p>
        ${this.accentBox(`
          <p class="text"><strong>Reason:</strong> ${data.reason}</p>
          ${data.suspendedUntil ? `<p class="text"><strong>Suspended Until:</strong> ${data.suspendedUntil}</p>` : ''}
        `)}
        <p class="text">If you believe this is a mistake or have questions, please contact us at support@unifesto.app.</p>
      </div>
    `);
    }
    getAccountReactivatedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Welcome Back</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Good news! Your Unifesto account has been reactivated.</p>
        <p class="text">You can now log in and access all your events, communities, and wallet.</p>
        ${this.ctaButton('Go to Unifesto', 'https://unifesto.app')}
      </div>
    `);
    }
    getNewDeviceLoginTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">New Login Detected</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">We detected a new login to your Unifesto account:</p>
        ${this.accentBox(`
          <p class="text"><strong>Device:</strong> ${data.device}</p>
          <p class="text"><strong>Location:</strong> ${data.location}</p>
          <p class="text"><strong>Time:</strong> ${data.time}</p>
        `)}
        <p class="text">If this was you, no action needed.</p>
        <p class="text">If you didn't log in from this device, please secure your account immediately:</p>
        ${this.ctaButton('Secure My Account', data.loginLink)}
      </div>
    `);
    }
    getSuspiciousActivityTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Security Alert</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">We detected unusual activity on your Unifesto account:</p>
        ${this.accentBox(`
          <p class="text"><strong>Activity:</strong> ${data.activityDescription}</p>
          <p class="text"><strong>Time:</strong> ${data.time}</p>
        `)}
        <p class="text">If this was you, you can ignore this email. Otherwise, please review your account and change your password.</p>
        ${this.ctaButton('Review Account', 'https://unifesto.app/account/security')}
        <p class="text">If you have concerns, contact us at support@unifesto.app.</p>
      </div>
    `);
    }
    getEventCancelledTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Event Cancelled</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Unfortunately, <strong>${data.eventTitle}</strong> scheduled for ${data.eventDate} has been cancelled.</p>
        ${data.cancellationReason ? this.accentBox(`<p class="text"><strong>Reason:</strong> ${data.cancellationReason}</p>`) : ''}
        ${data.refundInfo ? this.accentBox(`<p class="text">${data.refundInfo}</p>`) : ''}
        <p class="text">We apologize for the inconvenience. Explore other events happening near you.</p>
        ${this.ctaButton('Browse Events', 'https://unifesto.app/events')}
      </div>
    `);
    }
    getEventUpdatedTemplate(data) {
        const changesHtml = data.changes.map(c => `<p class="text"><strong>${c.field}:</strong> ${c.oldValue} → ${c.newValue}</p>`).join('');
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Event Details Updated</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">The details for <strong>${data.eventTitle}</strong> have been updated:</p>
        ${this.accentBox(changesHtml)}
        ${data.newDate ? `<p class="text"><strong>New Date:</strong> ${data.newDate}</p>` : ''}
        ${data.newTime ? `<p class="text"><strong>New Time:</strong> ${data.newTime}</p>` : ''}
        ${data.newVenue ? `<p class="text"><strong>New Venue:</strong> ${data.newVenue}</p>` : ''}
        <p class="text">Your registration is still valid. See you there!</p>
      </div>
    `);
    }
    getEventPublishedTemplate(data) {
        const location = data.isOnline
            ? `Online Event`
            : `${data.venueName}${data.city ? `, ${data.city}` : ''}`;
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">New Event in ${data.spaceName}</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">A new event has been published in a space you follow:</p>
        ${this.accentBox(`
          <p class="text"><strong>${data.eventTitle}</strong></p>
          <p class="text">Date: ${data.eventDate} at ${data.eventTime}</p>
          <p class="text">Location: ${location}</p>
        `)}
        ${this.ctaButton('View Event & Register', data.registrationUrl)}
      </div>
    `);
    }
    getWaitlistConfirmationTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">You're on the Waitlist</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">You've been added to the waitlist for <strong>${data.eventTitle}</strong> on ${data.eventDate}.</p>
        ${this.accentBox(`<p class="text">Your waitlist position: <strong>#${data.waitlistPosition}</strong></p>`)}
        <p class="text">We'll notify you by email if a spot opens up. Keep an eye on your inbox!</p>
      </div>
    `);
    }
    getWaitlistPromotedTemplate(data) {
        const location = data.isOnline
            ? `<p class="text"><strong>Online Event:</strong> <a href="${data.onlineUrl}">${data.onlineUrl}</a></p>`
            : `<p class="text"><strong>Venue:</strong> ${data.venueName}${data.city ? `, ${data.city}` : ''}</p>`;
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">A Spot Opened Up</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Good news! A spot is now available for <strong>${data.eventTitle}</strong>.</p>
        ${this.accentBox(`
          <p class="text">Date: ${data.eventDate} at ${data.eventTime}</p>
          ${location}
        `)}
        <p class="text">This offer expires in <strong>${data.expiresInHours} hours</strong>. Register now to secure your spot!</p>
        ${this.ctaButton('Register Now', data.registrationUrl)}
      </div>
    `);
    }
    getEventSummaryTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Thanks for Attending</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Thank you for attending <strong>${data.eventTitle}</strong>. We hope you had a great experience!</p>
        ${this.accentBox(`
          <p class="text">Total Attendees: <strong>${data.attendeeCount}</strong></p>
          <p class="text">Coins Awarded: <strong>${data.coinsAwarded}</strong></p>
        `)}
        ${data.photosUrl ? `<p class="text">Event photos are now available. <a href="${data.photosUrl}">View photos</a></p>` : ''}
        <p class="text">We'd love to see you at our next event!</p>
        ${this.ctaButton('Explore More Events', 'https://unifesto.app/events')}
      </div>
    `);
    }
    getEventStartingSoonTemplate(data) {
        const location = data.isOnline
            ? `<p class="text"><strong>Join Online:</strong> <a href="${data.onlineUrl}">${data.onlineUrl}</a></p>`
            : `<p class="text"><strong>Venue:</strong> ${data.venueName}${data.city ? `, ${data.city}` : ''}</p>`;
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Starting in 1 Hour</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text"><strong>${data.eventTitle}</strong> is starting in ${data.startsInMinutes} minutes!</p>
        ${this.accentBox(location)}
        <p class="text">Make sure you have your QR code ready for check-in:</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}" alt="QR Code" width="200" height="200" style="max-width: 200px;" />
        </div>
        <p class="text">See you soon!</p>
      </div>
    `);
    }
    getSpeakerInvitationTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">You're Invited to Speak</h1>
        <p class="text">Hi ${data.speakerName},</p>
        <p class="text"><strong>${data.organizerName}</strong> would like to invite you as a speaker at:</p>
        ${this.accentBox(`
          <p class="text"><strong>${data.eventTitle}</strong></p>
          <p class="text">Date: ${data.eventDate} at ${data.eventTime}</p>
        `)}
        <p class="text">We'd be honored to have you share your insights with our community.</p>
        <div style="text-align: center; margin: 20px 0;">
          ${this.ctaButton('Accept Invitation', data.acceptUrl)}
          <br /><br />
          <a href="${data.declineUrl}" style="color: #888; text-decoration: none;">Decline</a>
        </div>
      </div>
    `);
    }
    getSpaceMemberJoinedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">New Member Joined</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text"><strong>${data.memberName}</strong> just joined your space <strong>${data.spaceName}</strong>!</p>
        ${this.accentBox(`<p class="text">Total Members: <strong>${data.totalMembers}</strong></p>`)}
        <p class="text">Your community is growing. Keep creating amazing events!</p>
        ${this.ctaButton('View Your Space', 'https://unifesto.app/spaces/' + data.spaceName.toLowerCase().replace(/ /g, '-'))}
      </div>
    `);
    }
    getCoOrganizerInvitedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Co-Organiser Invitation</h1>
        <p class="text">Hi ${data.inviteeName},</p>
        <p class="text"><strong>${data.inviterName}</strong> has invited you to be a co-organiser of <strong>${data.spaceName}</strong>.</p>
        <p class="text">As a co-organiser, you'll be able to create events, manage members, and help grow the community.</p>
        ${this.ctaButton('Accept Invitation', data.acceptUrl)}
        <p class="text">Excited to have you on board!</p>
      </div>
    `);
    }
    getCoOrganizerRemovedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Co-Organiser Role Removed</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">You've been removed as a co-organiser of <strong>${data.spaceName}</strong>.</p>
        <p class="text">You're still a member of the space and can continue attending events.</p>
        <p class="text">If you have questions, please reach out to the space organiser.</p>
      </div>
    `);
    }
    getParentSpaceRequestSubmittedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Join Request Received</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text"><strong>${data.spaceName}</strong> has requested to join your space <strong>${data.parentSpaceName}</strong> as a subspace.</p>
        <p class="text">Review the request and decide whether to approve or decline.</p>
        ${this.ctaButton('Review Request', 'https://unifesto.app/spaces/requests')}
      </div>
    `);
    }
    getParentSpaceRequestApprovedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Request Approved</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text">Your request to join <strong>${data.parentSpaceName}</strong> has been approved!</p>
        <p class="text"><strong>${data.spaceName}</strong> is now a subspace and will appear under the parent space.</p>
        ${this.ctaButton('View Your Space', 'https://unifesto.app/spaces/' + data.spaceName.toLowerCase().replace(/ /g, '-'))}
      </div>
    `);
    }
    getParentSpaceRequestRejectedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Request Update</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text">Your request for <strong>${data.spaceName}</strong> to join <strong>${data.parentSpaceName}</strong> was not approved.</p>
        ${data.reason ? this.accentBox(`<p class="text"><strong>Reason:</strong> ${data.reason}</p>`) : ''}
        <p class="text">You can continue managing your space independently or reach out to the parent space organiser for more information.</p>
      </div>
    `);
    }
    getSpaceSuspendedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Space Suspended</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text">Your space <strong>${data.spaceName}</strong> has been suspended by Unifesto administrators.</p>
        ${this.accentBox(`<p class="text"><strong>Reason:</strong> ${data.reason}</p>`)}
        <p class="text">During the suspension period, your space and events will not be visible to members.</p>
        <p class="text">If you believe this is a mistake or would like to appeal, contact us at support@unifesto.app.</p>
      </div>
    `);
    }
    getSpaceArchivedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Space Archived</h1>
        <p class="text">Hi ${data.organizerName},</p>
        <p class="text">Your space <strong>${data.spaceName}</strong> has been archived as requested.</p>
        <p class="text">The space is no longer visible, but your data is preserved. You can unarchive it anytime from your dashboard.</p>
        ${this.ctaButton('Go to Dashboard', 'https://unifesto.app/dashboard')}
      </div>
    `);
    }
    getPaymentFailedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Payment Failed</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">We couldn't process your payment for <strong>${data.eventTitle}</strong>.</p>
        ${this.accentBox(`
          <p class="text"><strong>Amount:</strong> ₹${data.amount}</p>
          ${data.reason ? `<p class="text"><strong>Reason:</strong> ${data.reason}</p>` : ''}
        `)}
        <p class="text">You can try again or use a different payment method.</p>
        ${this.ctaButton('Retry Payment', data.retryUrl)}
        <p class="text">If you continue to face issues, contact us at support@unifesto.app.</p>
      </div>
    `);
    }
    getRedeemCodeUsedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Coins Added</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">You successfully redeemed the code <strong>${data.code}</strong>.</p>
        ${this.coinsBox(data.coinsReceived, 'Coins added to your wallet')}
        <p class="text">Your new balance: <strong>${data.newBalance} Pocket Coins</strong></p>
        ${this.ctaButton('View Wallet', 'https://unifesto.app/wallet')}
      </div>
    `);
    }
    getAdminCoinGrantTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Coins Added by Unifesto</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Unifesto has added Pocket Coins to your wallet.</p>
        ${this.accentBox(`<p class="text"><strong>Reason:</strong> ${data.reason}</p>`)}
        ${this.coinsBox(data.coinsGranted, 'Coins added to your wallet')}
        <p class="text">Your new balance: <strong>${data.newBalance} Pocket Coins</strong></p>
        ${this.ctaButton('View Wallet', 'https://unifesto.app/wallet')}
      </div>
    `);
    }
    getPartnerCoinCreditTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Coins Received from ${data.partnerName}</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">You've received Pocket Coins from our partner <strong>${data.partnerName}</strong>!</p>
        ${this.coinsBox(data.coinsReceived, 'Coins added to your wallet')}
        <p class="text">Your new balance: <strong>${data.newBalance} Pocket Coins</strong></p>
        ${this.ctaButton('Use Your Coins', 'https://unifesto.app/events')}
      </div>
    `);
    }
    getLowBalanceAlertTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Low Balance Alert</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your Pocket Coins balance is running low.</p>
        ${this.accentBox(`
          <p class="text">Current Balance: <strong>${data.currentBalance} Pocket Coins</strong></p>
          <p class="text">Alert Threshold: ${data.threshold} coins</p>
        `)}
        <p class="text">Earn more coins by attending events, referring friends, or completing challenges.</p>
        ${this.ctaButton('Earn More Coins', 'https://unifesto.app/earn')}
      </div>
    `);
    }
    getRefundProcessedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Refund Processed</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your refund for <strong>${data.eventTitle}</strong> has been processed.</p>
        ${this.accentBox(`
          <p class="text"><strong>Refund Amount:</strong> ₹${data.refundAmount}</p>
          <p class="text"><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p class="text">The amount will be credited to your original payment method within ${data.processingDays} business days.</p>
        `)}
        <p class="text">If you have questions, contact us at support@unifesto.app.</p>
      </div>
    `);
    }
    getSubscriptionActivatedTemplate(data) {
        const featuresHtml = data.features.map(f => `<li>${f}</li>`).join('');
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Welcome to ${data.plan}</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your <strong>${data.plan}</strong> subscription is now active!</p>
        ${this.accentBox(`
          <p class="text"><strong>Plan:</strong> ${data.plan}</p>
          <p class="text"><strong>Billing Cycle:</strong> ${data.billingCycle}</p>
          <p class="text"><strong>Amount:</strong> ₹${data.amount}</p>
          ${data.expiresAt ? `<p class="text"><strong>Expires:</strong> ${data.expiresAt}</p>` : ''}
        `)}
        <p class="text"><strong>Your benefits:</strong></p>
        <ul>${featuresHtml}</ul>
        ${this.ctaButton('Explore Your Benefits', 'https://unifesto.app/subscription')}
      </div>
    `);
    }
    getSubscriptionCancelledTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Subscription Cancelled</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your <strong>${data.plan}</strong> subscription has been cancelled as requested.</p>
        ${this.accentBox(`
          <p class="text">Your benefits will remain active until <strong>${data.expiresAt}</strong>.</p>
        `)}
        <p class="text">After that, your account will revert to the free plan.</p>
        <p class="text">We're sorry to see you go. If you'd like to reactivate, you can do so anytime.</p>
        ${this.ctaButton('Reactivate Subscription', 'https://unifesto.app/subscription')}
      </div>
    `);
    }
    getSubscriptionExpiringTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Your Plan Expires Soon</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your <strong>${data.plan}</strong> subscription expires in 7 days on <strong>${data.expiresAt}</strong>.</p>
        <p class="text">Renew now to continue enjoying premium benefits without interruption.</p>
        ${this.ctaButton('Renew Subscription', data.renewUrl)}
        <p class="text">If you don't renew, your account will switch to the free plan after expiry.</p>
      </div>
    `);
    }
    getSubscriptionExpiredTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Subscription Expired</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your <strong>${data.plan}</strong> subscription has expired.</p>
        <p class="text">Your account has been downgraded to <strong>${data.downgradedTo}</strong>.</p>
        <p class="text">You can reactivate your subscription anytime to regain premium benefits.</p>
        ${this.ctaButton('Reactivate Subscription', 'https://unifesto.app/subscription')}
      </div>
    `);
    }
    getSubscriptionUpgradedTemplate(data) {
        const newFeaturesHtml = data.newFeatures.map(f => `<li>${f}</li>`).join('');
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">You've Upgraded to ${data.toPlan}</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Congratulations! You've upgraded from <strong>${data.fromPlan}</strong> to <strong>${data.toPlan}</strong>.</p>
        <p class="text"><strong>New features unlocked:</strong></p>
        <ul>${newFeaturesHtml}</ul>
        ${this.ctaButton('Explore New Features', 'https://unifesto.app/subscription')}
      </div>
    `);
    }
    getSubscriptionDowngradedTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Plan Changed</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Your subscription has been changed from <strong>${data.fromPlan}</strong> to <strong>${data.toPlan}</strong>.</p>
        <p class="text">Some features may no longer be available. You can upgrade again anytime.</p>
        ${this.ctaButton('View Plans', 'https://unifesto.app/pricing')}
      </div>
    `);
    }
    getInvoiceTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Your Invoice</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Here's your invoice for your Unifesto subscription.</p>
        ${this.accentBox(`
          <p class="text"><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p class="text"><strong>Plan:</strong> ${data.plan}</p>
          <p class="text"><strong>Billing Cycle:</strong> ${data.billingCycle}</p>
          <p class="text"><strong>Amount:</strong> ₹${data.amount}</p>
          <p class="text"><strong>Billing Date:</strong> ${data.billingDate}</p>
          <p class="text"><strong>Payment ID:</strong> ${data.paymentId}</p>
        `)}
        ${this.ctaButton('Download Invoice', 'https://unifesto.app/invoices/' + data.invoiceNumber)}
      </div>
    `);
    }
    getReferralCodeReminderTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Share Your Referral Code</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Share your unique referral code and earn Pocket Coins every time someone joins!</p>
        ${this.accentBox(`
          <p class="text" style="text-align: center; font-size: 24px; font-weight: 700; color: #3491ff;">${data.referralCode}</p>
        `)}
        ${this.coinsBox(data.coinsEarned, `Total coins earned so far from ${data.totalReferred} referrals`)}
        <p class="text">Share your code with friends and family:</p>
        ${this.ctaButton('Share Your Code', data.shareUrl)}
      </div>
    `);
    }
    getReferralMilestoneTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Milestone Reached</h1>
        <p class="text">Hi ${data.userName},</p>
        <p class="text">Congratulations! You've referred <strong>${data.milestone} people</strong> to Unifesto!</p>
        ${this.coinsBox(data.bonusCoins, 'Bonus coins added to your wallet')}
        <p class="text">Total coins earned from referrals: <strong>${data.totalCoinsEarned} Pocket Coins</strong></p>
        <p class="text">Keep sharing and reaching new milestones!</p>
        ${this.ctaButton('Share More', 'https://unifesto.app/referrals')}
      </div>
    `);
    }
    getDailyAdminDigestTemplate(data) {
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Daily Digest - ${data.date}</h1>
        <p class="text">Here's your daily summary of Unifesto platform activity.</p>
        ${this.accentBox(`
          <p class="text"><strong>New Users:</strong> ${data.newUsers}</p>
          <p class="text"><strong>New Spaces:</strong> ${data.newSpaces}</p>
          <p class="text"><strong>New Events:</strong> ${data.newEvents}</p>
          <p class="text"><strong>Total Registrations:</strong> ${data.totalRegistrations}</p>
          <p class="text"><strong>Total Revenue:</strong> ₹${data.totalRevenue}</p>
          <p class="text"><strong>Active Users:</strong> ${data.activeUsers}</p>
        `)}
        ${this.ctaButton('View Dashboard', 'https://admin.unifesto.app/dashboard')}
      </div>
    `);
    }
    getWeeklyReportTemplate(data) {
        const metricsHtml = data.metrics.map(m => `<p class="text"><strong>${m.label}:</strong> ${m.value} (${m.change})</p>`).join('');
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Weekly Report - Week of ${data.weekStarting}</h1>
        <p class="text">Here's your weekly platform performance summary.</p>
        ${this.accentBox(metricsHtml)}
        ${this.ctaButton('View Full Report', 'https://admin.unifesto.app/reports')}
      </div>
    `);
    }
    getMonthlyInvoiceSummaryTemplate(data) {
        const topEventsHtml = data.topEvents.map(e => `<p class="text">${e.title}: ₹${e.revenue}</p>`).join('');
        return this.emailWrapper(`
      ${this.logoHeader()}
      <div class="content">
        <h1 class="heading">Monthly Revenue Summary - ${data.month}</h1>
        <p class="text">Here's your monthly revenue breakdown.</p>
        ${this.accentBox(`
          <p class="text"><strong>Total Revenue:</strong> ₹${data.totalRevenue}</p>
          <p class="text"><strong>Total Transactions:</strong> ${data.totalTransactions}</p>
        `)}
        <p class="text"><strong>Top Events by Revenue:</strong></p>
        ${this.accentBox(topEventsHtml)}
        ${this.ctaButton('View Detailed Report', 'https://admin.unifesto.app/revenue')}
      </div>
    `);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map