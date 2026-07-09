import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
export declare class ReferralsService {
    private readonly prisma;
    private readonly walletService;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, emailService: EmailService);
    generateReferralCode(): string;
    ensureReferralCode(userId: string): Promise<string>;
    getMyReferralStats(userId: string): Promise<{
        referralCode: string | null;
        totalReferred: number;
        totalCoinsEarned: number;
        referrals: {
            userId: string;
            name: string | null;
            username: string | null;
            joinedAt: Date;
            coinsAwarded: number;
            awardedAt: Date | null;
        }[];
    }>;
    applyReferralCode(userId: string, code: string): Promise<{
        message: string;
        coinsEarned: number;
    }>;
    getAllReferrals(page?: number, limit?: number): Promise<{
        data: ({
            referrer: {
                id: string;
                username: string | null;
                fullName: string | null;
                referralCode: string | null;
            };
            referred: {
                id: string;
                username: string | null;
                fullName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            referrerId: string;
            referredId: string;
            coinsAwarded: number;
            awardedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
