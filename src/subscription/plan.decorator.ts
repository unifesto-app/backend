import { SetMetadata } from '@nestjs/common';
import { OrgPlan } from '@prisma/client';

export const PLAN_KEY = 'requiredPlan';
export const RequirePlan = (...plans: OrgPlan[]) => SetMetadata(PLAN_KEY, plans);
