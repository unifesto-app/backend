import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
export declare class EventSchedulerService {
    private readonly prisma;
    private readonly emailService;
    private readonly whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, whatsappService: WhatsAppService);
    sendEventReminders(): Promise<void>;
    sendEventStartingSoonNotifications(): Promise<void>;
    markCompletedEvents(): Promise<void>;
    sendEventSummaries(): Promise<void>;
    private formatDate;
    private formatTime;
}
