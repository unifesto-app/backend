import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminEmailService } from './admin-email.service';

@Injectable()
export class AdminSchedulerService {
  private readonly logger = new Logger(AdminSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly adminEmailService: AdminEmailService,
  ) {}

  /**
   * Job 1: Send daily admin digest
   * Runs: Daily at 8 AM
   * Sends: Summary of yesterday's activity to admin
   */
  @Cron('0 8 * * *')
  async sendDailyAdminDigest(): Promise<void> {
    this.logger.log('Starting daily admin digest job...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      newUsers,
      newSpaces,
      newEvents,
      registrations,
      revenue,
      activeUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.space.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.event.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.eventRegistration.count({
        where: { registeredAt: { gte: yesterday } },
      }),
      this.prisma.eventRegistration.aggregate({
        where: {
          registeredAt: { gte: yesterday },
          paymentStatus: 'PAID',
        },
        _sum: { razorpayAmount: true },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: yesterday, lte: now },
        },
      }),
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';

    await this.emailService
      .sendDailyAdminDigest({
        adminEmail,
        date: this.formatDate(now),
        newUsers,
        newSpaces,
        newEvents,
        totalRegistrations: registrations,
        totalRevenue: Number(revenue._sum.razorpayAmount || 0),
        activeUsers,
      })
      .catch((err) => this.logger.error('Daily admin digest failed', err));

    this.logger.log('Daily admin digest sent successfully');
  }

  /**
   * Job 2: Send weekly report
   * Runs: Every Monday at 9 AM
   * Sends: Weekly summary to admin
   */
  @Cron('0 9 * * 1')
  async sendWeeklyReport(): Promise<void> {
    this.logger.log('Starting weekly report job...');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      totalEvents,
      newEvents,
      totalRevenue,
      totalRegistrations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.event.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.eventRegistration.aggregate({
        where: {
          registeredAt: { gte: weekAgo },
          paymentStatus: 'PAID',
        },
        _sum: { razorpayAmount: true },
      }),
      this.prisma.eventRegistration.count({
        where: { registeredAt: { gte: weekAgo } },
      }),
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';

    await this.emailService
      .sendWeeklyReport({
        adminEmail,
        weekStarting: this.formatDate(weekAgo),
        metrics: [
          {
            label: 'Total Users',
            value: totalUsers.toLocaleString(),
            change: `+${newUsers} this week`,
          },
          {
            label: 'Active Events',
            value: totalEvents.toLocaleString(),
            change: `+${newEvents} this week`,
          },
          {
            label: 'Registrations',
            value: totalRegistrations.toLocaleString(),
            change: 'this week',
          },
          {
            label: 'Revenue',
            value: `₹${Number(totalRevenue._sum.razorpayAmount || 0).toFixed(2)}`,
            change: 'this week',
          },
        ],
      })
      .catch((err) => this.logger.error('Weekly report failed', err));

    this.logger.log('Weekly report sent successfully');
  }

  /**
   * Job 3: Send monthly invoice summary
   * Runs: 1st of every month at 7 AM
   * Sends: Last month's revenue and transaction summary
   */
  @Cron('0 7 1 * *')
  async sendMonthlyInvoiceSummary(): Promise<void> {
    this.logger.log('Starting monthly invoice summary job...');

    const now = new Date();
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenue, transactions, topEvents] = await Promise.all([
      this.prisma.eventRegistration.aggregate({
        where: {
          registeredAt: { gte: firstOfLastMonth, lte: firstOfThisMonth },
          paymentStatus: 'PAID',
        },
        _sum: { razorpayAmount: true },
      }),
      this.prisma.eventRegistration.count({
        where: {
          registeredAt: { gte: firstOfLastMonth, lte: firstOfThisMonth },
          paymentStatus: 'PAID',
        },
      }),
      this.prisma.event.findMany({
        where: {
          createdAt: { gte: firstOfLastMonth, lte: firstOfThisMonth },
        },
        orderBy: { registeredCount: 'desc' },
        take: 5,
        select: { title: true, registeredCount: true },
      }),
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';
    const monthName = firstOfLastMonth.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });

    await this.emailService
      .sendMonthlyInvoiceSummary({
        adminEmail,
        month: monthName,
        totalRevenue: Number(revenue._sum.razorpayAmount || 0),
        totalTransactions: transactions,
        topEvents: topEvents.map((e) => ({
          title: e.title,
          revenue: e.registeredCount * 499, // approximate
        })),
      })
      .catch((err) => this.logger.error('Monthly invoice summary failed', err));

    this.logger.log(`Monthly invoice summary sent for ${monthName}`);
  }

  /**
   * Job 4: Process scheduled email campaigns
   * Runs: Every 10 minutes
   * Finds: Campaigns scheduled to be sent
   */
  @Cron('*/10 * * * *')
  async processScheduledCampaigns(): Promise<void> {
    this.logger.log('Starting scheduled campaigns job...');

    const now = new Date();

    const campaigns = await this.prisma.emailCampaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      take: 5, // process 5 at a time
    });

    for (const campaign of campaigns) {
      this.logger.log(`Processing scheduled campaign ${campaign.id}`);

      // Trigger campaign processing via AdminEmailService
      await this.adminEmailService
        .processScheduledCampaign(campaign.id)
        .catch((err) =>
          this.logger.error(
            `Campaign ${campaign.id} processing failed`,
            err,
          ),
        );
    }

    this.logger.log(
      `Scheduled campaigns job completed. Processed ${campaigns.length} campaigns`,
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
