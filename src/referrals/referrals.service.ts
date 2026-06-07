import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { CoinSource } from '@prisma/client';
import { COIN_CONSTANTS } from '../wallet/coin.constants';
import * as crypto from 'crypto';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly emailService: EmailService,
  ) {}

  generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  async ensureReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (user?.referralCode) {
      return user.referralCode;
    }

    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      code = this.generateReferralCode();
      const existing = await this.prisma.user.findUnique({
        where: { referralCode: code },
      });

      if (!existing) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
        });
        return code;
      }

      attempts++;
    }

    throw new BadRequestException('Failed to generate unique referral code');
  }

  async getMyReferralStats(userId: string) {
    await this.ensureReferralCode(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralsMade: {
          include: {
            referred: {
              select: {
                id: true,
                fullName: true,
                username: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalReferred = user.referralsMade.length;
    const totalCoinsEarned = user.referralsMade.reduce(
      (sum, ref) => sum + ref.coinsAwarded,
      0,
    );

    return {
      referralCode: user.referralCode,
      totalReferred,
      totalCoinsEarned,
      referrals: user.referralsMade.map((ref) => ({
        userId: ref.referred.id,
        name: ref.referred.fullName,
        username: ref.referred.username,
        joinedAt: ref.referred.createdAt,
        coinsAwarded: ref.coinsAwarded,
        awardedAt: ref.awardedAt,
      })),
    };
  }

  async applyReferralCode(userId: string, code: string) {
    const existingReferral = await this.prisma.referral.findUnique({
      where: { referredId: userId },
    });

    if (existingReferral) {
      throw new BadRequestException('You have already used a referral code');
    }

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
    });

    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }

    if (referrer.id === userId) {
      throw new BadRequestException('You cannot refer yourself');
    }

    return this.prisma.$transaction(async (tx) => {
      const referral = await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: userId,
          coinsAwarded: COIN_CONSTANTS.REFER_FRIEND_REWARD,
          awardedAt: new Date(),
        },
      });

      await this.walletService.creditCoins(
        userId,
        COIN_CONSTANTS.REFERRED_JOIN_REWARD,
        CoinSource.REFERRAL,
        `Welcome bonus from referral code ${code}`,
        {
          referenceId: referral.id,
          referenceType: 'Referral',
          note: `Referred by ${referrer.username || referrer.fullName}`,
        },
      );

      await this.walletService.creditCoins(
        referrer.id,
        COIN_CONSTANTS.REFER_FRIEND_REWARD,
        CoinSource.REFERRAL,
        `Referral reward for inviting a friend`,
        {
          referenceId: referral.id,
          referenceType: 'Referral',
          note: `Invited user ${userId}`,
        },
      );

      this.logger.log(
        `User ${userId} applied referral code ${code} from user ${referrer.id}`,
      );

      // Send email notification to referrer (non-blocking)
      const referrerIdentity = await tx.userIdentity.findFirst({
        where: { userId: referrer.id, email: { not: null } },
        select: { email: true },
      });

      const referredUser = await tx.user.findUnique({
        where: { id: userId },
        select: { fullName: true, username: true },
      });

      const referrerWallet = await this.walletService.getWallet(referrer.id);

      if (referrerIdentity?.email && referredUser) {
        this.emailService.sendReferralSuccess({
          email: referrerIdentity.email,
          referrerName: referrer.fullName || referrer.username || 'there',
          referredName: referredUser.fullName || referredUser.username || 'Friend',
          coinsEarned: COIN_CONSTANTS.REFER_FRIEND_REWARD,
          newBalance: referrerWallet.balance,
        }).catch(err => this.logger.error('Failed to send referral success email', err));
      }

      return {
        message: 'Referral code applied successfully',
        coinsEarned: COIN_CONSTANTS.REFERRED_JOIN_REWARD,
      };
    });
  }

  async getAllReferrals(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: {
            select: {
              id: true,
              fullName: true,
              username: true,
              referralCode: true,
            },
          },
          referred: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.referral.count(),
    ]);

    return {
      data: referrals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
