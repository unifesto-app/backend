import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { CacheService } from '../cache/cache.service';
export declare class CheckinService {
    private readonly prisma;
    private readonly walletService;
    private readonly emailService;
    private readonly cache;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, emailService: EmailService, cache: CacheService);
    canManageCheckin(userId: string, spaceId: string): Promise<boolean>;
    scanQRCode(userId: string, qrCode: string): Promise<{
        alreadyCheckedIn: boolean;
        checkedInAt: any;
        attendee: any;
        ticketType: any;
        success?: undefined;
        coinsAwarded?: undefined;
    } | {
        success: boolean;
        checkedInAt: Date;
        attendee: any;
        ticketType: any;
        coinsAwarded: number;
        alreadyCheckedIn?: undefined;
    }>;
    private checkInRegistration;
    private checkInTicket;
    getEventRegistrationsForOffline(userId: string, eventId: string): Promise<{
        eventId: string;
        eventTitle: string;
        registrations: any[];
        totalCount: number;
        checkedInCount: number;
        fromCache: boolean;
    }>;
    getCheckinStats(userId: string, eventId: string): Promise<{
        total: number;
        checkedIn: number;
        remaining: number;
        cancelled: number;
        checkInRate: string | number;
    }>;
    bulkCheckin(userId: string, eventId: string, registrationIds: string[]): Promise<{
        success: Array<{
            id: string;
            name: string | null;
        }>;
        failed: Array<{
            id: string;
            reason: string;
        }>;
        alreadyCheckedIn: Array<{
            id: string;
            name: string | null;
        }>;
    }>;
}
