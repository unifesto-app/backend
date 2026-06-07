import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CacheService } from '../cache/cache.service';
import { OrgPlan } from '@prisma/client';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Job 1: Handle expired subscriptions
   * Runs: Daily at midnight
   * Finds: Active paid subscriptions that have expired
   * Action: Downgrade to STARTER and send emails
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSubscriptions(): Promise<void> {
    this.logger.log('Starting expired subscriptions job...');

    const now = new Date();

    const expired = await this.prisma.orgSubscription.findMany({
      where: {
        expiresAt: { lte: now },
        isActive: true,
        plan: { not: OrgPlan.STARTER },
      },
      include: {
        user: {
          include: {
            identities: {
              where: { email: { not: null } },
              select: { email: true },
              take: 1,
            },
          },
        },
      },
    });

    for (const sub of expired) {
      const oldPlan = sub.plan;

      // Update subscription to STARTER
      await this.prisma.orgSubscription.update({
        where: { id: sub.id },
        data: {
          plan: OrgPlan.STARTER,
          isActive: false,
          cancelledAt: now,
        },
      });

      // Invalidate plan cache
      await this.cache.invalidatePlanCache(sub.userId);

      const email = sub.user.identities[0]?.email;
      if (email) {
        // Send subscription expired email
        this.emailService
          .sendSubscriptionExpired({
            email,
            userName: sub.user.fullName || sub.user.username || 'there',
            plan: oldPlan,
            downgradedTo: 'STARTER',
          })
          .catch((err) =>
            this.logger.error('Subscription expired email failed', err),
          );

        // Send subscription downgraded email
        this.emailService
          .sendSubscriptionDowngraded({
            email,
            userName: sub.user.fullName || sub.user.username || 'there',
            fromPlan: oldPlan,
            toPlan: 'STARTER',
          })
          .catch((err) =>
            this.logger.error('Subscription downgraded email failed', err),
          );
      }

      this.logger.log(
        `Downgraded subscription ${sub.id} from ${oldPlan} to STARTER`,
      );
    }

    this.logger.log(
      `Expired subscriptions job completed. Downgraded ${expired.length} subscriptions`,
    );
  }

  /**
   * Job 2: Send expiring subscription warnings
   * Runs: Daily at 9 AM
   * Finds: Subscriptions expiring in 7 days
   * Action: Send reminder email
   */
  @Cron('0 9 * * *')
  async sendExpiringSubscriptionWarnings(): Promise<void> {
    this.logger.log('Starting expiring subscription warnings job...');

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    const expiring = await this.prisma.orgSubscription.findMany({
      where: {
        expiresAt: { gte: in6Days, lte: in7Days },
        isActive: true,
        plan: { not: OrgPlan.STARTER },
      },
      include: {
        user: {
          include: {
            identities: {
              where: { email: { not: null } },
              select: { email: true },
              take: 1,
            },
          },
        },
      },
    });

    for (const sub of expiring) {
      const email = sub.user.identities[0]?.email;
      if (email && sub.expiresAt) {
        this.emailService
          .sendSubscriptionExpiring({
            email,
            userName: sub.user.fullName || sub.user.username || 'there',
            plan: sub.plan,
            expiresAt: this.formatDate(sub.expiresAt),
            renewUrl: 'https://forge.unifesto.app/subscription',
          })
          .catch((err) =>
            this.logger.error('Subscription expiring email failed', err),
          );
      }
    }

    this.logger.log(
      `Expiring subscription warnings job completed. Sent ${expiring.length} warnings`,
    );
  }

  /**
   * Job 3: Reset monthly event counts
   * Runs: 1st of every month at midnight
   * Action: Reset eventsThisMonth counter for all subscriptions
   */
  @Cron('0 0 1 * *')
  async resetMonthlyEventCounts(): Promise<void> {
    this.logger.log('Starting monthly event count reset job...');

    const result = await this.prisma.orgSubscription.updateMany({
      data: {
        eventsThisMonth: 0,
        usageResetAt: new Date(),
      },
    });

    this.logger.log(
      `Monthly event count reset completed. Reset ${result.count} subscriptions`,
    );
  }

  /**
   * Helper: Format date for display
   * Output: "7 June 2026"
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
