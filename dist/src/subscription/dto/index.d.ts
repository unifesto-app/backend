import { BillingCycle, OrgPlan } from '@prisma/client';
export declare class UpgradeSubscriptionDto {
    plan: OrgPlan;
    billingCycle: BillingCycle;
}
export declare class VerifyUpgradeDto {
    orderId: string;
    paymentId: string;
    signature: string;
}
export declare class AdminUpdateSubscriptionDto {
    plan?: OrgPlan;
    reason?: string;
}
export declare class SubscriptionResponseDto {
    id: string;
    plan: OrgPlan;
    billingCycle: BillingCycle;
    isActive: boolean;
    startedAt: Date;
    expiresAt?: Date;
    nextPaymentAt?: Date;
    eventsThisMonth: number;
    usageResetAt: Date;
}
export declare class SubscriptionUsageDto {
    spacesCount: number;
    eventsThisMonth: number;
    plan: OrgPlan;
    limits: {
        spaces: number | null;
        eventsPerMonth: number | null;
        attendeesPerEvent: number | null;
        ticketTypes: number | null;
        coOrganisers: number | null;
    };
}
