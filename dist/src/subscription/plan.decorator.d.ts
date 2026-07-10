import { OrgPlan } from '@prisma/client';
export declare const PLAN_KEY = "requiredPlan";
export declare const RequirePlan: (...plans: OrgPlan[]) => import("@nestjs/common").CustomDecorator<string>;
