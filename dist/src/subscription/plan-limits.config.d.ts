import { OrgPlan } from '@prisma/client';
export interface PlanLimits {
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
}
export declare const PLAN_LIMITS: Record<OrgPlan, PlanLimits>;
