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
var PayoutsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
const razorpay_1 = __importDefault(require("razorpay"));
let PayoutsService = PayoutsService_1 = class PayoutsService {
    prisma;
    emailService;
    logger = new common_1.Logger(PayoutsService_1.name);
    razorpay;
    DEFAULT_PLATFORM_FEE_PERCENT = 5;
    INSTANT_SURCHARGE_PERCENT = 2;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    async addBankAccount(userId, dto) {
        if (dto.isPrimary) {
            await this.prisma.organiserBankAccount.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        return this.prisma.organiserBankAccount.create({
            data: {
                userId,
                accountHolderName: dto.accountHolderName,
                accountNumber: dto.accountNumber,
                ifscCode: dto.ifscCode.toUpperCase(),
                bankName: dto.bankName,
                accountType: dto.accountType || 'savings',
                upiId: dto.upiId,
                isPrimary: dto.isPrimary || false,
            },
        });
    }
    async getMyBankAccounts(userId) {
        return this.prisma.organiserBankAccount.findMany({
            where: { userId },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async deleteBankAccount(userId, accountId) {
        const account = await this.prisma.organiserBankAccount.findFirst({
            where: { id: accountId, userId },
        });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        const pendingPayouts = await this.prisma.payout.count({
            where: {
                bankAccountId: accountId,
                status: { in: [client_1.PayoutStatus.PENDING, client_1.PayoutStatus.PROCESSING] },
            },
        });
        if (pendingPayouts > 0)
            throw new common_1.BadRequestException('Cannot delete account with pending payouts');
        return this.prisma.organiserBankAccount.delete({ where: { id: accountId } });
    }
    async updateBankAccountStatus(accountId, dto, adminId) {
        const account = await this.prisma.organiserBankAccount.findUnique({
            where: { id: accountId },
            include: { user: { include: { identities: { where: { email: { not: null } }, take: 1 } } } },
        });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        const updated = await this.prisma.organiserBankAccount.update({
            where: { id: accountId },
            data: {
                status: dto.status,
                verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
                verifiedBy: dto.status === 'VERIFIED' ? adminId : null,
                rejectionReason: dto.rejectionReason || null,
            },
        });
        if (dto.status === 'REJECTED') {
            const email = account.user.identities[0]?.email;
            if (email) {
                this.emailService
                    .sendBankAccountRejected({
                    email,
                    userName: account.user.fullName || account.user.username || 'there',
                    bankName: account.bankName,
                    accountNumber: account.accountNumber.slice(-4),
                    rejectionReason: dto.rejectionReason || 'Verification failed. Please resubmit with correct details.',
                })
                    .catch((err) => this.logger.error('Failed to send bank account rejected email', err));
            }
        }
        if (dto.status === 'VERIFIED') {
            const email = account.user.identities[0]?.email;
            if (email) {
                this.emailService
                    .sendRawEmail(email, 'Bank account verified — Unifesto', `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#16a34a">Bank Account Verified ✓</h2>
              <p>Hi ${account.user.fullName || account.user.username || 'there'},</p>
              <p>Your bank account ending in <strong>****${account.accountNumber.slice(-4)}</strong> at <strong>${account.bankName}</strong> has been verified successfully.</p>
              <p>You are now eligible to receive payouts for your events on Unifesto.</p>
              <a href="https://forge.unifesto.app/dashboard/payouts" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#16a34a;color:white;text-decoration:none;border-radius:8px">View Payouts</a>
            </div>
          `)
                    .catch((err) => this.logger.error('Failed to send bank account verified email', err));
            }
        }
        if (dto.status === 'VERIFIED') {
            try {
                await this.createRazorpayFundAccount(account);
            }
            catch (err) {
                this.logger.error(`Failed to create Razorpay fund account for ${accountId}`, err);
            }
        }
        return updated;
    }
    async createRazorpayFundAccount(account) {
        const contact = await this.razorpay.contacts.create({
            name: account.accountHolderName,
            type: 'vendor',
            reference_id: account.userId,
        });
        const fundAccount = await this.razorpay.fundAccount.create({
            contact_id: contact.id,
            account_type: 'bank_account',
            bank_account: {
                name: account.accountHolderName,
                ifsc: account.ifscCode,
                account_number: account.accountNumber,
            },
        });
        await this.prisma.organiserBankAccount.update({
            where: { id: account.id },
            data: {
                razorpayContactId: contact.id,
                razorpayFundAccountId: fundAccount.id,
            },
        });
        this.logger.log(`Created Razorpay fund account ${fundAccount.id} for account ${account.id}`);
    }
    async getEventPayoutSummary(eventId, userId) {
        const registrations = await this.prisma.eventRegistration.findMany({
            where: {
                eventId,
                paymentStatus: client_1.PaymentStatus.PAID,
                ...(userId ? { event: { createdBy: userId } } : {}),
            },
            select: { razorpayAmount: true },
        });
        const grossRevenue = registrations.reduce((sum, r) => sum + Number(r.razorpayAmount), 0);
        const existingPayout = await this.prisma.payout.findFirst({
            where: { eventId, status: { not: client_1.PayoutStatus.CANCELLED } },
            orderBy: { createdAt: 'desc' },
        });
        return {
            eventId,
            registrationCount: registrations.length,
            grossRevenue: Number(grossRevenue.toFixed(2)),
            defaultPlatformFeePercent: this.DEFAULT_PLATFORM_FEE_PERCENT,
            estimatedPlatformFee: Number((grossRevenue * this.DEFAULT_PLATFORM_FEE_PERCENT / 100).toFixed(2)),
            estimatedNetT2: Number((grossRevenue * (1 - this.DEFAULT_PLATFORM_FEE_PERCENT / 100)).toFixed(2)),
            estimatedNetInstant: Number((grossRevenue * (1 - (this.DEFAULT_PLATFORM_FEE_PERCENT + this.INSTANT_SURCHARGE_PERCENT) / 100)).toFixed(2)),
            existingPayout,
        };
    }
    async createPayout(dto, adminId) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
            include: { creator: true },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const existing = await this.prisma.payout.findFirst({
            where: {
                eventId: dto.eventId,
                status: { in: [client_1.PayoutStatus.PENDING, client_1.PayoutStatus.PROCESSING, client_1.PayoutStatus.COMPLETED] },
            },
        });
        if (existing)
            throw new common_1.ConflictException('A payout already exists for this event');
        const bankAccount = await this.prisma.organiserBankAccount.findFirst({
            where: { id: dto.bankAccountId, status: client_1.BankAccountStatus.VERIFIED },
        });
        if (!bankAccount)
            throw new common_1.BadRequestException('Bank account not found or not verified');
        const registrations = await this.prisma.eventRegistration.findMany({
            where: { eventId: dto.eventId, paymentStatus: client_1.PaymentStatus.PAID },
            select: { razorpayAmount: true },
        });
        const grossRevenue = registrations.reduce((sum, r) => sum + Number(r.razorpayAmount), 0);
        if (grossRevenue === 0)
            throw new common_1.BadRequestException('No paid revenue to payout for this event');
        const platformFeePercent = dto.platformFeePercent ?? this.DEFAULT_PLATFORM_FEE_PERCENT;
        const platformFee = grossRevenue * platformFeePercent / 100;
        const instantFee = dto.type === 'INSTANT' ? grossRevenue * this.INSTANT_SURCHARGE_PERCENT / 100 : 0;
        const netAmount = grossRevenue - platformFee - instantFee;
        const scheduledAt = dto.type === 'INSTANT'
            ? new Date()
            : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const payout = await this.prisma.payout.create({
            data: {
                eventId: dto.eventId,
                userId: event.createdBy,
                bankAccountId: dto.bankAccountId,
                grossRevenue,
                platformFeePercent,
                platformFee,
                instantFee,
                netAmount,
                type: dto.type,
                scheduledAt,
                status: client_1.PayoutStatus.PENDING,
                createdBy: adminId,
                notes: dto.notes,
            },
            include: {
                event: { select: { title: true } },
                user: { select: { fullName: true, username: true } },
                bankAccount: true,
            },
        });
        if (dto.type === 'INSTANT') {
            await this.processPayoutTransfer(payout.id);
        }
        return payout;
    }
    async processPayoutTransfer(payoutId) {
        const payout = await this.prisma.payout.findUnique({
            where: { id: payoutId },
            include: { bankAccount: true, event: true, user: true },
        });
        if (!payout)
            throw new common_1.NotFoundException('Payout not found');
        if (payout.status !== client_1.PayoutStatus.PENDING) {
            throw new common_1.BadRequestException(`Payout is ${payout.status}, cannot process`);
        }
        if (!payout.bankAccount.razorpayFundAccountId) {
            throw new common_1.BadRequestException('Bank account not linked to Razorpay. Verify the account first.');
        }
        await this.prisma.payout.update({
            where: { id: payoutId },
            data: { status: client_1.PayoutStatus.PROCESSING, processedAt: new Date() },
        });
        try {
            const transfer = await this.razorpay.payouts.create({
                account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                fund_account_id: payout.bankAccount.razorpayFundAccountId,
                amount: Math.round(Number(payout.netAmount) * 100),
                currency: 'INR',
                mode: payout.type === 'INSTANT' ? 'IMPS' : 'NEFT',
                purpose: 'payout',
                queue_if_low_balance: true,
                reference_id: payout.id,
                narration: `Unifesto payout - ${payout.event.title}`,
                notes: { payoutId: payout.id, eventId: payout.eventId, eventTitle: payout.event.title },
            });
            await this.prisma.payout.update({
                where: { id: payoutId },
                data: {
                    status: client_1.PayoutStatus.COMPLETED,
                    completedAt: new Date(),
                    razorpayPayoutId: transfer.id,
                    utr: transfer.utr || null,
                },
            });
            this.logger.log(`Payout ${payoutId} completed. Transfer: ${transfer.id}`);
        }
        catch (err) {
            await this.prisma.payout.update({
                where: { id: payoutId },
                data: {
                    status: client_1.PayoutStatus.FAILED,
                    failedAt: new Date(),
                    failureReason: err?.error?.description || err?.message || 'Transfer failed',
                },
            });
            this.logger.error(`Payout ${payoutId} failed`, err);
            throw new common_1.BadRequestException(err?.error?.description || 'Razorpay transfer failed');
        }
    }
    async cancelPayout(payoutId, adminId) {
        const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
        if (!payout)
            throw new common_1.NotFoundException('Payout not found');
        if (payout.status !== client_1.PayoutStatus.PENDING)
            throw new common_1.BadRequestException('Only PENDING payouts can be cancelled');
        return this.prisma.payout.update({
            where: { id: payoutId },
            data: { status: client_1.PayoutStatus.CANCELLED, notes: `Cancelled by admin ${adminId}` },
        });
    }
    async getAllPayouts(page = 1, limit = 20, status) {
        const where = status ? { status: status } : {};
        const [payouts, total] = await Promise.all([
            this.prisma.payout.findMany({
                where,
                include: {
                    event: { select: { id: true, title: true, slug: true } },
                    user: { select: { id: true, fullName: true, username: true } },
                    bankAccount: { select: { bankName: true, accountNumber: true, upiId: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.payout.count({ where }),
        ]);
        return { payouts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async getPayoutsForOrganiser(userId, page = 1, limit = 20) {
        const [payouts, total] = await Promise.all([
            this.prisma.payout.findMany({
                where: { userId },
                include: {
                    event: { select: { id: true, title: true, slug: true, startDateTime: true } },
                    bankAccount: { select: { bankName: true, accountNumber: true, upiId: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.payout.count({ where: { userId } }),
        ]);
        return { payouts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async getAllBankAccounts(page = 1, limit = 20, status) {
        const where = status ? { status: status } : {};
        const [accounts, total] = await Promise.all([
            this.prisma.organiserBankAccount.findMany({
                where,
                include: {
                    user: { select: { id: true, fullName: true, username: true, mobileNumber: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.organiserBankAccount.count({ where }),
        ]);
        return { accounts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
};
exports.PayoutsService = PayoutsService;
exports.PayoutsService = PayoutsService = PayoutsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map