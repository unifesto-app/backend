import {
  Injectable, Logger, NotFoundException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AddBankAccountDto, CreatePayoutDto, UpdateBankAccountStatusDto } from './dto';
import { PayoutStatus, PayoutType, BankAccountStatus, PaymentStatus } from '@prisma/client';
import Razorpay from 'razorpay';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);
  private readonly razorpay: Razorpay;
  private readonly DEFAULT_PLATFORM_FEE_PERCENT = 5;
  private readonly INSTANT_SURCHARGE_PERCENT = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async addBankAccount(userId: string, dto: AddBankAccountDto) {
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

  async getMyBankAccounts(userId: string) {
    return this.prisma.organiserBankAccount.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async deleteBankAccount(userId: string, accountId: string) {
    const account = await this.prisma.organiserBankAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Bank account not found');
    const pendingPayouts = await this.prisma.payout.count({
      where: {
        bankAccountId: accountId,
        status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
      },
    });
    if (pendingPayouts > 0) throw new BadRequestException('Cannot delete account with pending payouts');
    return this.prisma.organiserBankAccount.delete({ where: { id: accountId } });
  }

  async updateBankAccountStatus(accountId: string, dto: UpdateBankAccountStatusDto, adminId: string) {
    const account = await this.prisma.organiserBankAccount.findUnique({
      where: { id: accountId },
      include: { user: { include: { identities: { where: { email: { not: null } }, take: 1 } } } },
    });
    if (!account) throw new NotFoundException('Bank account not found');

    const updated = await this.prisma.organiserBankAccount.update({
      where: { id: accountId },
      data: {
        status: dto.status as BankAccountStatus,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
        verifiedBy: dto.status === 'VERIFIED' ? adminId : null,
        rejectionReason: dto.rejectionReason || null,
      },
    });

    if (dto.status === 'VERIFIED') {
      try {
        await this.createRazorpayFundAccount(account);
      } catch (err) {
        this.logger.error(`Failed to create Razorpay fund account for ${accountId}`, err);
      }
    }

    return updated;
  }

  private async createRazorpayFundAccount(account: any) {
    const contact = await (this.razorpay as any).contacts.create({
      name: account.accountHolderName,
      type: 'vendor',
      reference_id: account.userId,
    });
    const fundAccount = await (this.razorpay as any).fundAccount.create({
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

  async getEventPayoutSummary(eventId: string, userId?: string) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        paymentStatus: PaymentStatus.PAID,
        ...(userId ? { event: { createdBy: userId } } : {}),
      },
      select: { razorpayAmount: true },
    });

    const grossRevenue = registrations.reduce((sum, r) => sum + Number(r.razorpayAmount), 0);

    const existingPayout = await this.prisma.payout.findFirst({
      where: { eventId, status: { not: PayoutStatus.CANCELLED } },
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

  async createPayout(dto: CreatePayoutDto | { eventId: string; bankAccountId: string; type: 'T2' | 'INSTANT'; platformFeePercent?: number; notes?: string }, adminId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { creator: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.prisma.payout.findFirst({
      where: {
        eventId: dto.eventId,
        status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING, PayoutStatus.COMPLETED] },
      },
    });
    if (existing) throw new ConflictException('A payout already exists for this event');

    const bankAccount = await this.prisma.organiserBankAccount.findFirst({
      where: { id: dto.bankAccountId, status: BankAccountStatus.VERIFIED },
    });
    if (!bankAccount) throw new BadRequestException('Bank account not found or not verified');

    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId: dto.eventId, paymentStatus: PaymentStatus.PAID },
      select: { razorpayAmount: true },
    });

    const grossRevenue = registrations.reduce((sum, r) => sum + Number(r.razorpayAmount), 0);
    if (grossRevenue === 0) throw new BadRequestException('No paid revenue to payout for this event');

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
        type: dto.type as PayoutType,
        scheduledAt,
        status: PayoutStatus.PENDING,
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

  async processPayoutTransfer(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { bankAccount: true, event: true, user: true },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException(`Payout is ${payout.status}, cannot process`);
    }
    if (!payout.bankAccount.razorpayFundAccountId) {
      throw new BadRequestException('Bank account not linked to Razorpay. Verify the account first.');
    }

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.PROCESSING, processedAt: new Date() },
    });

    try {
      const transfer = await (this.razorpay as any).payouts.create({
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
          status: PayoutStatus.COMPLETED,
          completedAt: new Date(),
          razorpayPayoutId: transfer.id,
          utr: transfer.utr || null,
        },
      });

      this.logger.log(`Payout ${payoutId} completed. Transfer: ${transfer.id}`);
    } catch (err: any) {
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          failedAt: new Date(),
          failureReason: err?.error?.description || err?.message || 'Transfer failed',
        },
      });
      this.logger.error(`Payout ${payoutId} failed`, err);
      throw new BadRequestException(err?.error?.description || 'Razorpay transfer failed');
    }
  }

  async cancelPayout(payoutId: string, adminId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== PayoutStatus.PENDING) throw new BadRequestException('Only PENDING payouts can be cancelled');
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.CANCELLED, notes: `Cancelled by admin ${adminId}` },
    });
  }

  async getAllPayouts(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as PayoutStatus } : {};
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

  async getPayoutsForOrganiser(userId: string, page = 1, limit = 20) {
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

  async getAllBankAccounts(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as BankAccountStatus } : {};
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
}
