import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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

  @Cron('0 8 * * *')
  async sendDailyAdminDigest(): Promise<void> {
    this.logger.log('Running daily admin digest...');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [newUsers, newSpaces, newEvents, registrations, revenue] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.space.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.event.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.eventRegistration.count({ where: { registeredAt: { gte: yesterday } } }),
      this.prisma.eventRegistration.aggregate({
        where: { registeredAt: { gte: yesterday }, paymentStatus: 'PAID' },
        _sum: { razorpayAmount: true }
      }),
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';
    await this.emailService.sendDailyAdminDigest({
      adminEmail,
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      newUsers,
      newSpaces,
      newEvents,
      totalRegistrations: registrations,
      totalRevenue: Number(revenue._sum.razorpayAmount || 0),
      activeUsers: newUsers,
    }).catch(err => this.logger.error('Daily digest failed', err));

    this.logger.log('Daily admin digest sent');
  }

  @Cron('0 9 * * 1')
  async sendWeeklyReport(): Promise<void> {
    this.logger.log('Running weekly report...');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsers, totalEvents, newEvents, revenue, registrations] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.event.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.eventRegistration.aggregate({
        where: { registeredAt: { gte: weekAgo }, paymentStatus: 'PAID' },
        _sum: { razorpayAmount: true }
      }),
      this.prisma.eventRegistration.count({ where: { registeredAt: { gte: weekAgo } } }),
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';
    await this.emailService.sendWeeklyReport({
      adminEmail,
      weekStarting: weekAgo.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      metrics: [
        { label: 'Total Users', value: totalUsers.toLocaleString(), change: `+${newUsers} this week` },
        { label: 'Active Events', value: totalEvents.toLocaleString(), change: `+${newEvents} this week` },
        { label: 'Registrations', value: registrations.toLocaleString(), change: 'this week' },
        { label: 'Revenue', value: `₹${Number(revenue._sum.razorpayAmount || 0).toFixed(2)}`, change: 'this week' },
      ],
    }).catch(err => this.logger.error('Weekly report failed', err));

    this.logger.log('Weekly report sent');
  }

  @Cron('0 7 1 * *')
  async sendMonthlyInvoiceSummary(): Promise<void> {
    this.logger.log('Running monthly invoice summary...');
    const now = new Date();
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenue, transactions, topEvents] = await Promise.all([
      this.prisma.eventRegistration.aggregate({
        where: { registeredAt: { gte: firstOfLastMonth, lte: firstOfThisMonth }, paymentStatus: 'PAID' },
        _sum: { razorpayAmount: true }
      }),
      this.prisma.eventRegistration.count({
        where: { registeredAt: { gte: firstOfLastMonth, lte: firstOfThisMonth }, paymentStatus: 'PAID' }
      }),
      this.prisma.event.findMany({
        where: { createdAt: { gte: firstOfLastMonth, lte: firstOfThisMonth } },
        orderBy: { registeredCount: 'desc' },
        take: 5,
        select: { title: true, registeredCount: true }
      })
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';
    await this.emailService.sendMonthlyInvoiceSummary({
      adminEmail,
      month: firstOfLastMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      totalRevenue: Number(revenue._sum.razorpayAmount || 0),
      totalTransactions: transactions,
      topEvents: topEvents.map(e => ({ title: e.title, revenue: e.registeredCount * 499 })),
    }).catch(err => this.logger.error('Monthly summary failed', err));

    this.logger.log('Monthly invoice summary sent');
  }

  @Cron('*/10 * * * *')
  async processScheduledCampaigns(): Promise<void> {
    const now = new Date();
    const campaigns = await this.prisma.emailCampaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      take: 5,
    });

    for (const campaign of campaigns) {
      this.logger.log(`Processing scheduled campaign ${campaign.id}`);
      await this.adminEmailService.processScheduledCampaign(campaign.id)
        .catch(err => this.logger.error(`Campaign ${campaign.id} failed`, err));
    }
  }
}
