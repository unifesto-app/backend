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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
let WalletService = WalletService_1 = class WalletService {
    prisma;
    cache;
    emailService;
    logger = new common_1.Logger(WalletService_1.name);
    constructor(prisma, cache, emailService) {
        this.prisma = prisma;
        this.cache = cache;
        this.emailService = emailService;
    }
    async createWallet(userId) {
        return this.prisma.wallet.create({
            data: { userId },
        });
    }
    async getWallet(userId) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            wallet = await this.createWallet(userId);
        }
        await this.cache.setCachedBalance(userId, wallet.balance);
        return wallet;
    }
    async getTransactions(userId, page = 1, limit = 20) {
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
    async creditCoins(userId, coins, source, description, metadata) {
        if (metadata?.referenceId) {
            const action = source.toLowerCase();
            const canProceed = await this.cache.checkIdempotency(action, userId, metadata.referenceId);
            if (!canProceed) {
                this.logger.warn(`Duplicate coin credit attempt: ${action}:${userId}:${metadata.referenceId}`);
                throw new common_1.BadRequestException('This reward has already been processed');
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
                    type: client_1.TransactionType.CREDIT,
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
            this.logger.log(`Credited ${coins} coins to user ${userId}. New balance: ${updatedWallet.balance}`);
            return { wallet: updatedWallet, transaction };
        });
        await this.cache.invalidateBalanceCache(userId);
        return result;
    }
    async debitCoins(userId, coins, source, description, metadata) {
        const cachedBalance = await this.cache.getCachedBalance(userId);
        if (cachedBalance !== null && cachedBalance < coins) {
            throw new common_1.BadRequestException('Insufficient coin balance');
        }
        const wallet = await this.getWallet(userId);
        if (wallet.balance < coins) {
            throw new common_1.BadRequestException('Insufficient coin balance');
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
                    type: client_1.TransactionType.DEBIT,
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
            this.logger.log(`Debited ${coins} coins from user ${userId}. New balance: ${updatedWallet.balance}`);
            return { wallet: updatedWallet, transaction };
        });
        await this.cache.invalidateBalanceCache(userId);
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
    async redeemCode(userId, code) {
        const redeemCode = await this.prisma.redeemCode.findUnique({
            where: { code },
            include: {
                userRedemptions: {
                    where: { userId },
                },
            },
        });
        if (!redeemCode) {
            throw new common_1.NotFoundException('Redeem code not found');
        }
        if (!redeemCode.isActive) {
            throw new common_1.BadRequestException('Redeem code is inactive');
        }
        if (redeemCode.expiresAt && redeemCode.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Redeem code has expired');
        }
        if (redeemCode.totalUses !== null &&
            redeemCode.usedCount >= redeemCode.totalUses) {
            throw new common_1.BadRequestException('Redeem code usage limit reached');
        }
        if (redeemCode.userRedemptions.length >= redeemCode.perUserLimit) {
            throw new common_1.BadRequestException('You have already used this code');
        }
        if (redeemCode.restrictToUsers.length > 0 &&
            !redeemCode.restrictToUsers.includes(userId)) {
            throw new common_1.BadRequestException('You are not eligible for this code');
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
            const creditResult = await this.creditCoins(userId, redeemCode.coins, client_1.CoinSource.REDEEM_CODE, `Redeemed code: ${code}`, {
                redeemCodeId: redeemCode.id,
                note: redeemCode.description || undefined,
            });
            this.logger.log(`User ${userId} redeemed code ${code}`);
            return creditResult;
        });
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
    async adminGrantCoins(dto, adminId) {
        const result = await this.creditCoins(dto.userId, dto.coins, client_1.CoinSource.ADMIN_GRANT, dto.reason || 'Admin grant', {
            note: `Granted by admin ${adminId}`,
        });
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
    async createRedeemCode(dto, createdBy) {
        const existing = await this.prisma.redeemCode.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.BadRequestException('Code already exists');
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
    async updateRedeemCode(codeId, dto) {
        return this.prisma.redeemCode.update({
            where: { id: codeId },
            data: {
                isActive: dto.isActive,
                totalUses: dto.totalUses,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            },
        });
    }
    async deleteRedeemCode(codeId) {
        return this.prisma.redeemCode.update({
            where: { id: codeId },
            data: { isActive: false },
        });
    }
    async partnerRedeemCoins(dto, partnerId) {
        const partner = await this.prisma.partner.findUnique({
            where: { id: partnerId },
        });
        if (!partner || !partner.isActive) {
            throw new common_1.BadRequestException('Partner not active');
        }
        if (partner.maxCoinsPerTxn && dto.coins > partner.maxCoinsPerTxn) {
            throw new common_1.BadRequestException(`Cannot redeem more than ${partner.maxCoinsPerTxn} coins per transaction`);
        }
        const existingTxn = await this.prisma.walletTransaction.findFirst({
            where: {
                partnerId,
                partnerTxnId: dto.partnerTxnId,
            },
        });
        if (existingTxn) {
            throw new common_1.BadRequestException('Transaction already processed');
        }
        return this.creditCoins(dto.userId, dto.coins, client_1.CoinSource.PARTNER_REDEEM, dto.description || `Coins from ${partner.name}`, {
            partnerId,
            partnerTxnId: dto.partnerTxnId,
        });
    }
    async validateUser(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        email_service_1.EmailService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map