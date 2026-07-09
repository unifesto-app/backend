import { SubscriptionService } from './subscription.service';
import { AdminUpdateSubscriptionDto, SubscriptionUsageDto, UpgradeSubscriptionDto, VerifyUpgradeDto } from './dto';
export declare class SubscriptionController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    getMySubscription(req: any): Promise<{
        history: {
            id: string;
            reason: string | null;
            changedAt: Date;
            fromPlan: import("@prisma/client").$Enums.OrgPlan;
            toPlan: import("@prisma/client").$Enums.OrgPlan;
            subscriptionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        cancelledAt: Date | null;
        userId: string;
        plan: import("@prisma/client").$Enums.OrgPlan;
        billingCycle: import("@prisma/client").$Enums.BillingCycle;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        startedAt: Date;
        expiresAt: Date | null;
        razorpaySubId: string | null;
        lastPaymentAt: Date | null;
        nextPaymentAt: Date | null;
        eventsThisMonth: number;
        usageResetAt: Date;
    }>;
    getMyUsage(req: any): Promise<SubscriptionUsageDto>;
    getAllPlans(): Promise<{
        spaces: number | null;
        eventsPerMonth: number | null;
        attendeesPerEvent: number | null;
        ticketTypes: number | null;
        coOrganisers: number | null;
        hasWaitlist: boolean;
        hasBulkExport: boolean;
        hasAnalytics: boolean;
        hasWhatsappBlast: boolean;
        hasRecurringEvents: boolean;
        hasRemoveBranding: boolean;
        hasPrioritySupport: boolean;
        processingFeePercent: number;
        monthlyPrice: number | null;
        annualPrice: number | null;
        plan: string;
    }[]>;
    createUpgradeOrder(req: any, dto: UpgradeSubscriptionDto): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        plan: import("@prisma/client").$Enums.OrgPlan;
        billingCycle: import("@prisma/client").$Enums.BillingCycle;
    }>;
    verifyUpgrade(req: any, dto: VerifyUpgradeDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        cancelledAt: Date | null;
        userId: string;
        plan: import("@prisma/client").$Enums.OrgPlan;
        billingCycle: import("@prisma/client").$Enums.BillingCycle;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        startedAt: Date;
        expiresAt: Date | null;
        razorpaySubId: string | null;
        lastPaymentAt: Date | null;
        nextPaymentAt: Date | null;
        eventsThisMonth: number;
        usageResetAt: Date;
    }>;
    cancelSubscription(req: any): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        cancelledAt: Date | null;
        userId: string;
        plan: import("@prisma/client").$Enums.OrgPlan;
        billingCycle: import("@prisma/client").$Enums.BillingCycle;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        startedAt: Date;
        expiresAt: Date | null;
        razorpaySubId: string | null;
        lastPaymentAt: Date | null;
        nextPaymentAt: Date | null;
        eventsThisMonth: number;
        usageResetAt: Date;
    }>;
    getAllSubscriptions(page?: number, limit?: number): Promise<{
        data: ({
            user: {
                id: string;
                mobileNumber: string;
                username: string | null;
                fullName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            cancelledAt: Date | null;
            userId: string;
            plan: import("@prisma/client").$Enums.OrgPlan;
            billingCycle: import("@prisma/client").$Enums.BillingCycle;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            startedAt: Date;
            expiresAt: Date | null;
            razorpaySubId: string | null;
            lastPaymentAt: Date | null;
            nextPaymentAt: Date | null;
            eventsThisMonth: number;
            usageResetAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    adminUpdateSubscription(userId: string, dto: AdminUpdateSubscriptionDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        cancelledAt: Date | null;
        userId: string;
        plan: import("@prisma/client").$Enums.OrgPlan;
        billingCycle: import("@prisma/client").$Enums.BillingCycle;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        startedAt: Date;
        expiresAt: Date | null;
        razorpaySubId: string | null;
        lastPaymentAt: Date | null;
        nextPaymentAt: Date | null;
        eventsThisMonth: number;
        usageResetAt: Date;
    }>;
}
