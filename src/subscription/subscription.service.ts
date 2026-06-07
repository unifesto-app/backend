import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EmailService } from '../email/email.service';
import { BillingCycle, OrgPlan, Prisma } from '@prisma/client';
import { PLAN_LIMITS } from './plan-limits.config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import {
  AdminUpdateSubscriptionDto,
  SubscriptionUsageDto,
  UpgradeSubscriptionDto,
  VerifyUpgradeDto,
} from './dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly emailService: EmailService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createStarterSubscription(userId: string) {
    return this.prisma.orgSubscription.create({
      data: {
        userId,
        plan: OrgPlan.STARTER,
        billingCycle: BillingCycle.MONTHLY,
        isActive: true,
        usageResetAt: this.getNextMonthStart(),
      },
    });
  }

  async getMySubscription(userId: string) {
    const subscription = await this.prisma.orgSubscription.findUnique({
      where: { userId },
      include: {
        history: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Cache the plan for future requests
    await this.cache.setUserPlan(userId, subscription.plan);

    return subscription;
  }

  async getMyUsage(userId: string): Promise<SubscriptionUsageDto> {
    const subscription = await this.getMySubscription(userId);
    const spacesCount = await this.prisma.space.count({
      where: {
        createdBy: userId,
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
    });

    const limits = PLAN_LIMITS[subscription.plan];

    return {
      spacesCount,
      eventsThisMonth: subscription.eventsThisMonth,
      plan: subscription.plan,
      limits: {
        spaces: limits.spaces,
        eventsPerMonth: limits.eventsPerMonth,
        attendeesPerEvent: limits.attendeesPerEvent,
        ticketTypes: limits.ticketTypes,
        coOrganisers: limits.coOrganisers,
      },
    };
  }

  async getAllPlans() {
    return Object.entries(PLAN_LIMITS).map(([plan, limits]) => ({
      plan,
      ...limits,
    }));
  }

  async createUpgradeOrder(userId: string, dto: UpgradeSubscriptionDto) {
    const subscription = await this.getMySubscription(userId);

    if (
      subscription.plan === dto.plan &&
      subscription.billingCycle === dto.billingCycle
    ) {
      throw new BadRequestException('Already on this plan');
    }

    const planLimits = PLAN_LIMITS[dto.plan];
    const amount =
      dto.billingCycle === BillingCycle.MONTHLY
        ? planLimits.monthlyPrice
        : planLimits.annualPrice;

    if (amount === null || amount === 0) {
      throw new BadRequestException('Cannot upgrade to this plan via payment');
    }

    const order = await this.razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `sub_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan: dto.plan,
        billingCycle: dto.billingCycle,
      },
    });

    this.logger.log(`Created Razorpay order ${order.id} for user ${userId}`);

    return {
      orderId: order.id,
      amount,
      currency: 'INR',
      plan: dto.plan,
      billingCycle: dto.billingCycle,
    };
  }

  async verifyAndActivate(userId: string, dto: VerifyUpgradeDto) {
    const subscription = await this.getMySubscription(userId);

    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${dto.orderId}|${dto.paymentId}`)
      .digest('hex');

    if (signature !== dto.signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const order = await this.razorpay.orders.fetch(dto.orderId);
    const plan = order.notes?.plan as OrgPlan;
    const billingCycle = order.notes?.billingCycle as BillingCycle;

    const planLimits = PLAN_LIMITS[plan];
    const expiresAt =
      billingCycle === BillingCycle.MONTHLY
        ? this.getNextMonthStart()
        : this.getNextYearStart();

    const oldPlan = subscription.plan;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromPlan: subscription.plan,
          toPlan: plan,
          reason: 'Paid upgrade',
        },
      });

      return tx.orgSubscription.update({
        where: { id: subscription.id },
        data: {
          plan,
          billingCycle,
          amount: new Prisma.Decimal(Number(order.amount) / 100),
          isActive: true,
          expiresAt,
          lastPaymentAt: new Date(),
          nextPaymentAt: expiresAt,
        },
      });
    });

    // Invalidate plan cache after upgrade
    await this.cache.invalidatePlanCache(userId);

    this.logger.log(`Activated ${plan} plan for user ${userId}`);

    // Get plan features
    const planFeatures: Record<string, string[]> = {
      GROWTH: ['Up to 10 events/month', '200 attendees per event', 'Waitlist management', 'Bulk export'],
      PRO: ['Unlimited events', '1000 attendees per event', 'Analytics dashboard', 'WhatsApp blast', 'Remove branding'],
      ENTERPRISE: ['Unlimited everything', 'White label', 'Priority support', 'Custom integrations'],
    };

    // Send email notifications (non-blocking)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
      },
    });

    const userEmail = user?.identities[0]?.email;
    if (userEmail) {
      // Send appropriate email based on whether it's an upgrade or first activation
      if (oldPlan === OrgPlan.STARTER) {
        // First activation
        this.emailService
          .sendSubscriptionActivated({
            email: userEmail,
            userName: user.fullName || user.username || 'there',
            plan,
            billingCycle,
            amount: Number(updated.amount),
            expiresAt: this.formatDate(expiresAt),
            features: planFeatures[plan] || [],
          })
          .catch((err) => this.logger.error('Failed to send subscription activated email', err));
      } else {
        // Upgrade from paid plan to another paid plan
        this.emailService
          .sendSubscriptionUpgraded({
            email: userEmail,
            userName: user.fullName || user.username || 'there',
            fromPlan: oldPlan,
            toPlan: plan,
            newFeatures: planFeatures[plan] || [],
          })
          .catch((err) => this.logger.error('Failed to send subscription upgraded email', err));
      }
    }

    return updated;
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.getMySubscription(userId);

    if (subscription.plan === OrgPlan.STARTER) {
      throw new BadRequestException('Cannot cancel free plan');
    }

    const oldPlan = subscription.plan;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromPlan: subscription.plan,
          toPlan: OrgPlan.STARTER,
          reason: 'User cancelled',
        },
      });

      return tx.orgSubscription.update({
        where: { id: subscription.id },
        data: {
          plan: OrgPlan.STARTER,
          isActive: true,
          cancelledAt: new Date(),
          expiresAt: null,
          nextPaymentAt: null,
        },
      });
    });

    // Invalidate plan cache
    await this.cache.invalidatePlanCache(userId);

    this.logger.log(`Cancelled subscription for user ${userId}`);

    // Send cancellation email (non-blocking)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
      },
    });

    const userEmail = user?.identities[0]?.email;
    if (userEmail) {
      this.emailService
        .sendSubscriptionCancelled({
          email: userEmail,
          userName: user.fullName || user.username || 'there',
          plan: oldPlan,
          expiresAt: 'immediately',
        })
        .catch((err) => this.logger.error('Failed to send subscription cancelled email', err));
    }

    return updated;
  }

  async incrementEventUsage(userId: string) {
    const subscription = await this.getMySubscription(userId);

    if (subscription.usageResetAt < new Date()) {
      await this.prisma.orgSubscription.update({
        where: { id: subscription.id },
        data: {
          eventsThisMonth: 1,
          usageResetAt: this.getNextMonthStart(),
        },
      });
    } else {
      await this.prisma.orgSubscription.update({
        where: { id: subscription.id },
        data: {
          eventsThisMonth: { increment: 1 },
        },
      });
    }
  }

  async getAllSubscriptions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.orgSubscription.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              mobileNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orgSubscription.count(),
    ]);

    return {
      data: subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminUpdateSubscription(
    userId: string,
    dto: AdminUpdateSubscriptionDto,
  ) {
    const subscription = await this.getMySubscription(userId);

    if (dto.plan && dto.plan !== subscription.plan) {
      await this.prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromPlan: subscription.plan,
          toPlan: dto.plan,
          reason: dto.reason || 'Admin updated',
        },
      });

      const updated = await this.prisma.orgSubscription.update({
        where: { id: subscription.id },
        data: {
          plan: dto.plan,
        },
      });

      // Invalidate plan cache
      await this.cache.invalidatePlanCache(userId);

      return updated;
    }

    return subscription;
  }

  private getNextMonthStart(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getNextYearStart(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    date.setMonth(0);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
