import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutsService } from './payouts.service';
import { PayoutStatus } from '@prisma/client';

@Injectable()
export class PayoutsSchedulerService {
  private readonly logger = new Logger(PayoutsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payoutsService: PayoutsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledPayouts(): Promise<void> {
    this.logger.log('Checking for scheduled payouts to process...');
    const now = new Date();
    const due = await this.prisma.payout.findMany({
      where: { status: PayoutStatus.PENDING, scheduledAt: { lte: now }, type: 'T2' },
      select: { id: true },
    });
    if (due.length === 0) { this.logger.log('No payouts due'); return; }
    this.logger.log(`Processing ${due.length} scheduled payouts`);
    for (const payout of due) {
      try {
        await this.payoutsService.processPayoutTransfer(payout.id);
        this.logger.log(`Auto-processed payout ${payout.id}`);
      } catch (err) {
        this.logger.error(`Failed to auto-process payout ${payout.id}`, err);
      }
    }
  }

  @Cron('0 6 * * *')
  async autoCreatePayoutsForCompletedEvents(): Promise<void> {
    this.logger.log('Auto-creating payouts for completed events...');
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.event.findMany({
      where: {
        endDateTime: { gte: fourDaysAgo, lte: twoDaysAgo },
        status: 'COMPLETED',
        payouts: { none: {} },
        registrations: { some: { paymentStatus: 'PAID' } },
      },
      include: {
        creator: {
          include: {
            bankAccounts: {
              where: { status: 'VERIFIED', isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });
    for (const event of events) {
      const primaryAccount = event.creator.bankAccounts[0];
      if (!primaryAccount) {
        this.logger.warn(`Event ${event.id} has revenue but organiser has no verified bank account — skipping`);
        continue;
      }
      try {
        await this.payoutsService.createPayout(
          { eventId: event.id, bankAccountId: primaryAccount.id, type: 'T2' },
          'SYSTEM',
        );
        this.logger.log(`Auto-created T+2 payout for event ${event.id}`);
      } catch (err) {
        this.logger.error(`Failed to auto-create payout for event ${event.id}`, err);
      }
    }
  }
}
