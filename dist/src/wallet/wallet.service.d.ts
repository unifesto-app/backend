import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EmailService } from '../email/email.service';
import { CoinSource } from '@prisma/client';
import { AdminGrantCoinsDto, CreateRedeemCodeDto, PartnerRedeemDto, UpdateRedeemCodeDto } from './dto';
export declare class WalletService {
    private readonly prisma;
    private readonly cache;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, cache: CacheService, emailService: EmailService);
    createWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        totalEarned: number;
        totalSpent: number;
    }>;
    getWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        totalEarned: number;
        totalSpent: number;
    }>;
    getTransactions(userId: string, page?: number, limit?: number): Promise<{
        data: ({
            redeemCode: {
                code: string;
            } | null;
            partner: {
                name: string;
                slug: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            description: string;
            type: import("@prisma/client").$Enums.TransactionType;
            coins: number;
            partnerTxnId: string | null;
            source: import("@prisma/client").$Enums.CoinSource;
            balanceBefore: number;
            balanceAfter: number;
            note: string | null;
            walletId: string;
            referenceId: string | null;
            referenceType: string | null;
            redeemCodeId: string | null;
            partnerId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    creditCoins(userId: string, coins: number, source: CoinSource, description: string, metadata?: {
        referenceId?: string;
        referenceType?: string;
        note?: string;
        redeemCodeId?: string;
        partnerId?: string;
        partnerTxnId?: string;
    }): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: number;
            totalEarned: number;
            totalSpent: number;
        };
        transaction: {
            id: string;
            createdAt: Date;
            description: string;
            type: import("@prisma/client").$Enums.TransactionType;
            coins: number;
            partnerTxnId: string | null;
            source: import("@prisma/client").$Enums.CoinSource;
            balanceBefore: number;
            balanceAfter: number;
            note: string | null;
            walletId: string;
            referenceId: string | null;
            referenceType: string | null;
            redeemCodeId: string | null;
            partnerId: string | null;
        };
    }>;
    debitCoins(userId: string, coins: number, source: CoinSource, description: string, metadata?: {
        referenceId?: string;
        referenceType?: string;
        note?: string;
    }): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: number;
            totalEarned: number;
            totalSpent: number;
        };
        transaction: {
            id: string;
            createdAt: Date;
            description: string;
            type: import("@prisma/client").$Enums.TransactionType;
            coins: number;
            partnerTxnId: string | null;
            source: import("@prisma/client").$Enums.CoinSource;
            balanceBefore: number;
            balanceAfter: number;
            note: string | null;
            walletId: string;
            referenceId: string | null;
            referenceType: string | null;
            redeemCodeId: string | null;
            partnerId: string | null;
        };
    }>;
    redeemCode(userId: string, code: string): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: number;
            totalEarned: number;
            totalSpent: number;
        };
        transaction: {
            id: string;
            createdAt: Date;
            description: string;
            type: import("@prisma/client").$Enums.TransactionType;
            coins: number;
            partnerTxnId: string | null;
            source: import("@prisma/client").$Enums.CoinSource;
            balanceBefore: number;
            balanceAfter: number;
            note: string | null;
            walletId: string;
            referenceId: string | null;
            referenceType: string | null;
            redeemCodeId: string | null;
            partnerId: string | null;
        };
    }>;
    adminGrantCoins(dto: AdminGrantCoinsDto, adminId: string): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: number;
            totalEarned: number;
            totalSpent: number;
        };
        transaction: {
            id: string;
            createdAt: Date;
            description: string;
            type: import("@prisma/client").$Enums.TransactionType;
            coins: number;
            partnerTxnId: string | null;
            source: import("@prisma/client").$Enums.CoinSource;
            balanceBefore: number;
            balanceAfter: number;
            note: string | null;
            walletId: string;
            referenceId: string | null;
            referenceType: string | null;
            redeemCodeId: string | null;
            partnerId: string | null;
        };
    }>;
    createRedeemCode(dto: CreateRedeemCodeDto, createdBy: string): Promise<{
        id: string;
        code: string;
        createdAt: Date;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        createdBy: string;
        expiresAt: Date | null;
        coins: number;
        totalUses: number | null;
        perUserLimit: number;
        restrictToUsers: string[];
        usedCount: number;
    }>;
    getAllRedeemCodes(page?: number, limit?: number): Promise<{
        data: ({
            _count: {
                userRedemptions: number;
            };
            creator: {
                id: string;
                username: string | null;
                fullName: string | null;
            };
        } & {
            id: string;
            code: string;
            createdAt: Date;
            description: string | null;
            isActive: boolean;
            updatedAt: Date;
            createdBy: string;
            expiresAt: Date | null;
            coins: number;
            totalUses: number | null;
            perUserLimit: number;
            restrictToUsers: string[];
            usedCount: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateRedeemCode(codeId: string, dto: UpdateRedeemCodeDto): Promise<{
        id: string;
        code: string;
        createdAt: Date;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        createdBy: string;
        expiresAt: Date | null;
        coins: number;
        totalUses: number | null;
        perUserLimit: number;
        restrictToUsers: string[];
        usedCount: number;
    }>;
    deleteRedeemCode(codeId: string): Promise<{
        id: string;
        code: string;
        createdAt: Date;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        createdBy: string;
        expiresAt: Date | null;
        coins: number;
        totalUses: number | null;
        perUserLimit: number;
        restrictToUsers: string[];
        usedCount: number;
    }>;
    partnerRedeemCoins(dto: PartnerRedeemDto, partnerId: string): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: number;
            totalEarned: number;
            totalSpent: number;
        };
        transaction: {
            id: string;
            createdAt: Date;
            description: string;
            type: import("@prisma/client").$Enums.TransactionType;
            coins: number;
            partnerTxnId: string | null;
            source: import("@prisma/client").$Enums.CoinSource;
            balanceBefore: number;
            balanceAfter: number;
            note: string | null;
            walletId: string;
            referenceId: string | null;
            referenceType: string | null;
            redeemCodeId: string | null;
            partnerId: string | null;
        };
    }>;
    validateUser(userId: string): Promise<{
        id: string;
        wallet: {
            balance: number;
        } | null;
        mobileNumber: string;
        username: string | null;
        fullName: string | null;
    }>;
}
