import { ReferralsService } from './referrals.service';
declare class ApplyReferralDto {
    code: string;
}
export declare class ReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
    getMyReferralStats(req: any): Promise<{
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
    applyReferralCode(req: any, dto: ApplyReferralDto): Promise<{
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
export {};
