import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CacheService } from '../cache/cache.service';
export declare class SubscriptionSchedulerService {
    private readonly prisma;
    private readonly emailService;
    private readonly cache;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, cache: CacheService);
    handleExpiredSubscriptions(): Promise<void>;
    sendExpiringSubscriptionWarnings(): Promise<void>;
    resetMonthlyEventCounts(): Promise<void>;
    private formatDate;
}
