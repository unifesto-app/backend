import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class EventSchedulerService {
  private readonly logger = new Logger(EventSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  /**
   * Job 1: Send event reminders 24 hours before event
   * Runs: Every hour
   * Finds: Events starting in 23-25 hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendEventReminders(): Promise<void> {
    this.logger.log('Starting event reminder job...');

    const now = new Date();
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const events = await this.prisma.event.findMany({
      where: {
        startDateTime: { gte: in23Hours, lte: in25Hours },
        status: 'PUBLISHED',
      },
      include: {
        space: true,
      },
    });

    for (const event of events) {
      const registrations = await this.prisma.eventRegistration.findMany({
        where: {
          eventId: event.id,
          status: { not: 'CANCELLED' },
          isWaitlisted: false,
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
          tickets: { take: 1 },
        },
      });

      for (const reg of registrations) {
        const email = reg.user.identities[0]?.email;

        // Email reminder
        if (email) {
          this.emailService
            .sendEventReminder({
              email,
              userName: reg.user.fullName || reg.user.username || 'there',
              eventTitle: event.title,
              eventDate: this.formatDate(event.startDateTime),
              eventTime: this.formatTime(event.startDateTime, event.endDateTime),
              venueName: event.venueName || undefined,
              city: event.city || undefined,
              isOnline: event.type === 'ONLINE',
              onlineUrl: event.onlineUrl || undefined,
              qrCode: reg.qrCode,
              ticketCode: reg.tickets[0]?.ticketCode || undefined,
            })
            .catch((err) =>
              this.logger.error('Event reminder email failed', err),
            );
        }

        // WhatsApp reminder
        if (reg.user.mobileNumber) {
          this.whatsappService
            .sendEventReminder(reg.user.mobileNumber, {
              userName: reg.user.fullName || reg.user.username || 'there',
              eventTitle: event.title,
              eventDate: this.formatDate(event.startDateTime),
              eventTime: this.formatTime(event.startDateTime, event.endDateTime),
              venueName: event.venueName || undefined,
              city: event.city || undefined,
              isOnline: event.type === 'ONLINE',
              onlineUrl: event.onlineUrl || undefined,
            })
            .catch((err) =>
              this.logger.error('Event reminder WhatsApp failed', err),
            );
        }
      }

      this.logger.log(
        `Sent reminders for event ${event.id} to ${registrations.length} attendees`,
      );
    }

    this.logger.log(
      `Event reminder job completed. Processed ${events.length} events`,
    );
  }

  /**
   * Job 2: Send "event starting soon" notifications 1 hour before
   * Runs: Every 15 minutes
   * Finds: Events starting in 55-65 minutes
   */
  @Cron('*/15 * * * *')
  async sendEventStartingSoonNotifications(): Promise<void> {
    this.logger.log('Starting event starting soon job...');

    const now = new Date();
    const in55Min = new Date(now.getTime() + 55 * 60 * 1000);
    const in65Min = new Date(now.getTime() + 65 * 60 * 1000);

    const events = await this.prisma.event.findMany({
      where: {
        startDateTime: { gte: in55Min, lte: in65Min },
        status: 'PUBLISHED',
      },
    });

    for (const event of events) {
      const registrations = await this.prisma.eventRegistration.findMany({
        where: {
          eventId: event.id,
          status: { not: 'CANCELLED' },
          isWaitlisted: false,
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

      for (const reg of registrations) {
        const email = reg.user.identities[0]?.email;
        if (email) {
          this.emailService
            .sendEventStartingSoon({
              email,
              userName: reg.user.fullName || reg.user.username || 'there',
              eventTitle: event.title,
              startsInMinutes: 60,
              venueName: event.venueName || undefined,
              city: event.city || undefined,
              isOnline: event.type === 'ONLINE',
              onlineUrl: event.onlineUrl || undefined,
              qrCode: reg.qrCode,
            })
            .catch((err) =>
              this.logger.error('Event starting soon email failed', err),
            );
        }
      }

      this.logger.log(
        `Sent starting soon notifications for event ${event.id} to ${registrations.length} attendees`,
      );
    }

    this.logger.log(
      `Event starting soon job completed. Processed ${events.length} events`,
    );
  }

  /**
   * Job 3: Mark completed events
   * Runs: Every hour
   * Finds: Published events whose endDateTime has passed
   */
  @Cron(CronExpression.EVERY_HOUR)
  async markCompletedEvents(): Promise<void> {
    this.logger.log('Starting mark completed events job...');

    const now = new Date();

    const result = await this.prisma.event.updateMany({
      where: {
        endDateTime: { lte: now },
        status: 'PUBLISHED',
      },
      data: { status: 'COMPLETED' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} events as COMPLETED`);
    } else {
      this.logger.log('No events to mark as completed');
    }
  }

  /**
   * Job 4: Send event summaries to attendees post-event
   * Runs: Every hour
   * Finds: Events that completed in the last 1-2 hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendEventSummaries(): Promise<void> {
    this.logger.log('Starting event summary job...');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const completedEvents = await this.prisma.event.findMany({
      where: {
        endDateTime: { gte: twoHoursAgo, lte: oneHourAgo },
        status: 'COMPLETED',
      },
    });

    for (const event of completedEvents) {
      const attendees = await this.prisma.eventRegistration.findMany({
        where: {
          eventId: event.id,
          status: 'ATTENDED',
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

      for (const reg of attendees) {
        const email = reg.user.identities[0]?.email;
        if (email) {
          this.emailService
            .sendEventSummary({
              email,
              userName: reg.user.fullName || reg.user.username || 'there',
              eventTitle: event.title,
              attendeeCount: event.registeredCount,
              coinsAwarded: 50, // standard attendance reward
            })
            .catch((err) =>
              this.logger.error('Event summary email failed', err),
            );
        }
      }

      this.logger.log(
        `Sent event summaries for ${event.id} to ${attendees.length} attendees`,
      );
    }

    this.logger.log(
      `Event summary job completed. Processed ${completedEvents.length} events`,
    );
  }

  /**
   * Helper: Format date for display
   * Output: "7 June 2026"
   */
  private formatDate(dateTime: Date, timezone = 'Asia/Kolkata'): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    }).format(dateTime);
  }

  /**
   * Helper: Format time range
   * Output: "10:00 AM - 1:00 PM IST"
   */
  private formatTime(
    startTime: Date,
    endTime: Date,
    timezone = 'Asia/Kolkata',
  ): string {
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(d);

    return `${fmt(startTime)} - ${fmt(endTime)} IST`;
  }
}
