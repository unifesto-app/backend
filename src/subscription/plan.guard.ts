import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgPlan } from '@prisma/client';
import { PLAN_KEY } from './plan.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<OrgPlan[]>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlans) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const subscription = await this.prisma.orgSubscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.isActive) {
      throw new ForbiddenException('No active subscription');
    }

    if (!requiredPlans.includes(subscription.plan)) {
      throw new ForbiddenException(
        `This feature requires one of these plans: ${requiredPlans.join(', ')}`,
      );
    }

    return true;
  }
}
