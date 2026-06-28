"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReferralsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
const coin_constants_1 = require("../wallet/coin.constants");
const crypto = __importStar(require("crypto"));
let ReferralsService = ReferralsService_1 = class ReferralsService {
    prisma;
    walletService;
    emailService;
    logger = new common_1.Logger(ReferralsService_1.name);
    constructor(prisma, walletService, emailService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.emailService = emailService;
    }
    generateReferralCode() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    async ensureReferralCode(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true },
        });
        if (user?.referralCode) {
            return user.referralCode;
        }
        let code;
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
        throw new common_1.BadRequestException('Failed to generate unique referral code');
    }
    async getMyReferralStats(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        const totalReferred = user.referralsMade.length;
        const totalCoinsEarned = user.referralsMade.reduce((sum, ref) => sum + ref.coinsAwarded, 0);
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
    async applyReferralCode(userId, code) {
        const existingReferral = await this.prisma.referral.findUnique({
            where: { referredId: userId },
        });
        if (existingReferral) {
            throw new common_1.BadRequestException('You have already used a referral code');
        }
        const referrer = await this.prisma.user.findUnique({
            where: { referralCode: code.toUpperCase() },
        });
        if (!referrer) {
            throw new common_1.BadRequestException('Invalid referral code');
        }
        if (referrer.id === userId) {
            throw new common_1.BadRequestException('You cannot refer yourself');
        }
        return this.prisma.$transaction(async (tx) => {
            const referral = await tx.referral.create({
                data: {
                    referrerId: referrer.id,
                    referredId: userId,
                    coinsAwarded: coin_constants_1.COIN_CONSTANTS.REFER_FRIEND_REWARD,
                    awardedAt: new Date(),
                },
            });
            await this.walletService.creditCoins(userId, coin_constants_1.COIN_CONSTANTS.REFERRED_JOIN_REWARD, client_1.CoinSource.REFERRAL, `Welcome bonus from referral code ${code}`, {
                referenceId: referral.id,
                referenceType: 'Referral',
                note: `Referred by ${referrer.username || referrer.fullName}`,
            });
            await this.walletService.creditCoins(referrer.id, coin_constants_1.COIN_CONSTANTS.REFER_FRIEND_REWARD, client_1.CoinSource.REFERRAL, `Referral reward for inviting a friend`, {
                referenceId: referral.id,
                referenceType: 'Referral',
                note: `Invited user ${userId}`,
            });
            this.logger.log(`User ${userId} applied referral code ${code} from user ${referrer.id}`);
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
                    coinsEarned: coin_constants_1.COIN_CONSTANTS.REFER_FRIEND_REWARD,
                    newBalance: referrerWallet.balance,
                }).catch(err => this.logger.error('Failed to send referral success email', err));
            }
            return {
                message: 'Referral code applied successfully',
                coinsEarned: coin_constants_1.COIN_CONSTANTS.REFERRED_JOIN_REWARD,
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
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = ReferralsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        email_service_1.EmailService])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map