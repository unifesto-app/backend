import { WalletService } from './wallet.service';
import { CacheService } from '../cache/cache.service';
import { AdminGrantCoinsDto, CreateRedeemCodeDto, PartnerRedeemDto, RedeemCodeDto, UpdateRedeemCodeDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class WalletController {
    private readonly walletService;
    private readonly prisma;
    private readonly cache;
    constructor(walletService: WalletService, prisma: PrismaService, cache: CacheService);
    getMyWallet(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        totalEarned: number;
        totalSpent: number;
    }>;
    getMyTransactions(req: any, page?: number, limit?: number): Promise<{
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
    redeemCode(req: any, dto: RedeemCodeDto): Promise<{
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
    adminGrantCoins(req: any, dto: AdminGrantCoinsDto): Promise<{
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
    getUserWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        totalEarned: number;
        totalSpent: number;
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
    createRedeemCode(req: any, dto: CreateRedeemCodeDto): Promise<{
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
    updateRedeemCode(id: string, dto: UpdateRedeemCodeDto): Promise<{
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
    deleteRedeemCode(id: string): Promise<{
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
    partnerRedeem(apiKey: string, dto: PartnerRedeemDto): Promise<{
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
    validateUser(apiKey: string, userId: string): Promise<{
        id: string;
        wallet: {
            balance: number;
        } | null;
        mobileNumber: string;
        username: string | null;
        fullName: string | null;
    }>;
}
