import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminEmailService } from './admin-email.service';
export declare class AdminSchedulerService {
    private readonly prisma;
    private readonly emailService;
    private readonly adminEmailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, adminEmailService: AdminEmailService);
    sendDailyAdminDigest(): Promise<void>;
    sendWeeklyReport(): Promise<void>;
    sendMonthlyInvoiceSummary(): Promise<void>;
    processScheduledCampaigns(): Promise<void>;
}
