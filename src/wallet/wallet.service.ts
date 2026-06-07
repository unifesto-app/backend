import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EmailService } from '../email/email.service';
import { CoinSource, TransactionType } from '@prisma/client';
import { COIN_CONSTANTS, coinsToINR } from './coin.constants';
import {
  AdminGrantCoinsDto,
  CreateRedeemCodeDto,
  PartnerRedeemDto,
  UpdateRedeemCodeDto,
} from './dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly emailService: EmailService,
  ) {}

  async createWallet(userId: string) {
    return this.prisma.wallet.create({
      data: { userId },
    });
  }

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    // Update cache
    await this.cache.setCachedBalance(userId, wallet.balance);

    return wallet;
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.getWallet(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          redeemCode: {
            select: { code: true },
          },
          partner: {
            select: { name: true, slug: true },
          },
        },
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async creditCoins(
    userId: string,
    coins: number,
    source: CoinSource,
    description: string,
    metadata?: {
      referenceId?: string;
      referenceType?: string;
      note?: string;
      redeemCodeId?: string;
      partnerId?: string;
      partnerTxnId?: string;
    },
  ) {
    // Check idempotency if referenceId provided
    if (metadata?.referenceId) {
      const action = source.toLowerCase();
      const canProceed = await this.cache.checkIdempotency(
        action,
        userId,
        metadata.referenceId,
      );

      if (!canProceed) {
        this.logger.warn(
          `Duplicate coin credit attempt: ${action}:${userId}:${metadata.referenceId}`,
        );
        throw new BadRequestException('This reward has already been processed');
      }
    }

    const wallet = await this.getWallet(userId);

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: coins },
          totalEarned: { increment: coins },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          source,
          coins,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          description,
          note: metadata?.note,
          referenceId: metadata?.referenceId,
          referenceType: metadata?.referenceType,
          redeemCodeId: metadata?.redeemCodeId,
          partnerId: metadata?.partnerId,
          partnerTxnId: metadata?.partnerTxnId,
        },
      });

      this.logger.log(
        `Credited ${coins} coins to user ${userId}. New balance: ${updatedWallet.balance}`,
      );

      return { wallet: updatedWallet, transaction };
    });

    // Invalidate balance cache after successful credit
    await this.cache.invalidateBalanceCache(userId);

    return result;
  }

  async debitCoins(
    userId: string,
    coins: number,
    source: CoinSource,
    description: string,
    metadata?: {
      referenceId?: string;
      referenceType?: string;
      note?: string;
    },
  ) {
    // Check cached balance first
    const cachedBalance = await this.cache.getCachedBalance(userId);
    if (cachedBalance !== null && cachedBalance < coins) {
      throw new BadRequestException('Insufficient coin balance');
    }

    const wallet = await this.getWallet(userId);

    if (wallet.balance < coins) {
      throw new BadRequestException('Insufficient coin balance');
    }

    const previousBalance = wallet.balance;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: coins },
          totalSpent: { increment: coins },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.DEBIT,
          source,
          coins,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          description,
          note: metadata?.note,
          referenceId: metadata?.referenceId,
          referenceType: metadata?.referenceType,
        },
      });

      this.logger.log(
        `Debited ${coins} coins from user ${userId}. New balance: ${updatedWallet.balance}`,
      );

      return { wallet: updatedWallet, transaction };
    });

    // Invalidate balance cache after successful debit
    await this.cache.invalidateBalanceCache(userId);

    // Check for low balance alert (non-blocking)
    const LOW_BALANCE_THRESHOLD = 50;
    const newBalance = result.wallet.balance;

    if (newBalance < LOW_BALANCE_THRESHOLD && previousBalance >= LOW_BALANCE_THRESHOLD) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
        },
      });

      const userEmail = user?.identities[0]?.email;
      if (userEmail) {
        this.emailService
          .sendLowBalanceAlert({
            email: userEmail,
            userName: user.fullName || user.username || 'there',
            currentBalance: newBalance,
            threshold: LOW_BALANCE_THRESHOLD,
          })
          .catch((err) => this.logger.error('Failed to send low balance alert', err));
      }
    }

    return result;
  }

  async redeemCode(userId: string, code: string) {
    const redeemCode = await this.prisma.redeemCode.findUnique({
      where: { code },
      include: {
        userRedemptions: {
          where: { userId },
        },
      },
    });

    if (!redeemCode) {
      throw new NotFoundException('Redeem code not found');
    }

    if (!redeemCode.isActive) {
      throw new BadRequestException('Redeem code is inactive');
    }

    if (redeemCode.expiresAt && redeemCode.expiresAt < new Date()) {
      throw new BadRequestException('Redeem code has expired');
    }

    if (
      redeemCode.totalUses !== null &&
      redeemCode.usedCount >= redeemCode.totalUses
    ) {
      throw new BadRequestException('Redeem code usage limit reached');
    }

    if (redeemCode.userRedemptions.length >= redeemCode.perUserLimit) {
      throw new BadRequestException('You have already used this code');
    }

    if (
      redeemCode.restrictToUsers.length > 0 &&
      !redeemCode.restrictToUsers.includes(userId)
    ) {
      throw new BadRequestException('You are not eligible for this code');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.redeemCode.update({
        where: { id: redeemCode.id },
        data: { usedCount: { increment: 1 } },
      });

      await tx.redeemCodeUsage.create({
        data: {
          codeId: redeemCode.id,
          userId,
        },
      });

      const creditResult = await this.creditCoins(
        userId,
        redeemCode.coins,
        CoinSource.REDEEM_CODE,
        `Redeemed code: ${code}`,
        {
          redeemCodeId: redeemCode.id,
          note: redeemCode.description || undefined,
        },
      );

      this.logger.log(`User ${userId} redeemed code ${code}`);

      return creditResult;
    });

    // Send redeem code used email (non-blocking)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
      },
    });

    const userEmail = user?.identities[0]?.email;
    if (userEmail) {
      this.emailService
        .sendRedeemCodeUsed({
          email: userEmail,
          userName: user.fullName || user.username || 'there',
          code: code.toUpperCase(),
          coinsReceived: redeemCode.coins,
          newBalance: result.wallet.balance,
        })
        .catch((err) => this.logger.error('Failed to send redeem code used email', err));
    }

    return result;
  }

  async adminGrantCoins(dto: AdminGrantCoinsDto, adminId: string) {
    const result = await this.creditCoins(
      dto.userId,
      dto.coins,
      CoinSource.ADMIN_GRANT,
      dto.reason || 'Admin grant',
      {
        note: `Granted by admin ${adminId}`,
      },
    );

    // Send admin coin grant email (non-blocking)
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
      },
    });

    const userEmail = user?.identities[0]?.email;
    if (userEmail) {
      this.emailService
        .sendAdminCoinGrant({
          email: userEmail,
          userName: user.fullName || user.username || 'there',
          coinsGranted: dto.coins,
          reason: dto.reason || 'Admin grant',
          newBalance: result.wallet.balance,
        })
        .catch((err) => this.logger.error('Failed to send admin coin grant email', err));
    }

    return result;
  }

  async createRedeemCode(dto: CreateRedeemCodeDto, createdBy: string) {
    const existing = await this.prisma.redeemCode.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('Code already exists');
    }

    return this.prisma.redeemCode.create({
      data: {
        code: dto.code.toUpperCase(),
        coins: dto.coins,
        totalUses: dto.totalUses,
        perUserLimit: dto.perUserLimit || 1,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        restrictToUsers: dto.restrictToUsers || [],
        description: dto.description,
        createdBy,
      },
    });
  }

  async getAllRedeemCodes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [codes, total] = await Promise.all([
      this.prisma.redeemCode.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, fullName: true, username: true },
          },
          _count: {
            select: { userRedemptions: true },
          },
        },
      }),
      this.prisma.redeemCode.count(),
    ]);

    return {
      data: codes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRedeemCode(codeId: string, dto: UpdateRedeemCodeDto) {
    return this.prisma.redeemCode.update({
      where: { id: codeId },
      data: {
        isActive: dto.isActive,
        totalUses: dto.totalUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async deleteRedeemCode(codeId: string) {
    return this.prisma.redeemCode.update({
      where: { id: codeId },
      data: { isActive: false },
    });
  }

  async partnerRedeemCoins(dto: PartnerRedeemDto, partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner || !partner.isActive) {
      throw new BadRequestException('Partner not active');
    }

    if (partner.maxCoinsPerTxn && dto.coins > partner.maxCoinsPerTxn) {
      throw new BadRequestException(
        `Cannot redeem more than ${partner.maxCoinsPerTxn} coins per transaction`,
      );
    }

    const existingTxn = await this.prisma.walletTransaction.findFirst({
      where: {
        partnerId,
        partnerTxnId: dto.partnerTxnId,
      },
    });

    if (existingTxn) {
      throw new BadRequestException('Transaction already processed');
    }

    return this.creditCoins(
      dto.userId,
      dto.coins,
      CoinSource.PARTNER_REDEEM,
      dto.description || `Coins from ${partner.name}`,
      {
        partnerId,
        partnerTxnId: dto.partnerTxnId,
      },
    );
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        mobileNumber: true,
        wallet: {
          select: { balance: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
