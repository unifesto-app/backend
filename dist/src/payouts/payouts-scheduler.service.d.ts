import { PrismaService } from '../prisma/prisma.service';
import { PayoutsService } from './payouts.service';
export declare class PayoutsSchedulerService {
    private readonly prisma;
    private readonly payoutsService;
    private readonly logger;
    constructor(prisma: PrismaService, payoutsService: PayoutsService);
    processScheduledPayouts(): Promise<void>;
    autoCreatePayoutsForCompletedEvents(): Promise<void>;
}
