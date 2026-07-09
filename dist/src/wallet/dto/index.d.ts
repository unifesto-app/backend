import { CoinSource, TransactionType } from '@prisma/client';
export declare class RedeemCodeDto {
    code: string;
}
export declare class AdminGrantCoinsDto {
    userId: string;
    coins: number;
    reason?: string;
}
export declare class CreateRedeemCodeDto {
    code: string;
    coins: number;
    totalUses?: number;
    perUserLimit?: number;
    expiresAt?: string;
    restrictToUsers?: string[];
    description?: string;
}
export declare class UpdateRedeemCodeDto {
    isActive?: boolean;
    totalUses?: number;
    expiresAt?: string;
}
export declare class PartnerRedeemDto {
    userId: string;
    coins: number;
    partnerTxnId: string;
    description?: string;
}
export declare class CreatePartnerDto {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    websiteUrl?: string;
    maxCoinsPerTxn?: number;
}
export declare class UpdatePartnerDto {
    isActive?: boolean;
    maxCoinsPerTxn?: number;
    description?: string;
}
export declare class WalletResponseDto {
    id: string;
    balance: number;
    totalEarned: number;
    totalSpent: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WalletTransactionResponseDto {
    id: string;
    type: TransactionType;
    source: CoinSource;
    coins: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    note?: string;
    createdAt: Date;
}
