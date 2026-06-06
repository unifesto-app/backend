import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CacheService } from '../cache/cache.service';
import { CoinSource, RegistrationStatus, TicketStatus } from '@prisma/client';
import { COIN_CONSTANTS } from '../wallet/coin.constants';

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly cache: CacheService,
  ) {}

  async canManageCheckin(userId: string, spaceId: string): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        spaceId,
        role: {
          code: {
            in: ['ORGANISER', 'CO_ORGANISER'],
          },
        },
      },
    });

    return userRoles.length > 0;
  }

  async scanQRCode(userId: string, qrCode: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { qrCode },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            spaceId: true,
            startDateTime: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        ticketType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!registration) {
      const ticket = await this.prisma.eventTicket.findUnique({
        where: { qrCode },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  spaceId: true,
                  startDateTime: true,
                },
              },
              user: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                  avatarUrl: true,
                },
              },
              ticketType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Invalid QR code');
      }

      return this.checkInTicket(userId, ticket);
    }

    return this.checkInRegistration(userId, registration);
  }

  private async checkInRegistration(userId: string, registration: any) {
    const canManage = await this.canManageCheckin(
      userId,
      registration.event.spaceId,
    );

    if (!canManage) {
      throw new BadRequestException(
        'You are not authorized to check in attendees for this event',
      );
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Registration has been cancelled');
    }

    if (registration.checkedInAt) {
      return {
        alreadyCheckedIn: true,
        checkedInAt: registration.checkedInAt,
        attendee: registration.user,
        ticketType: registration.ticketType?.name || 'RSVP',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          checkedInAt: new Date(),
          checkedInBy: userId,
          status: RegistrationStatus.ATTENDED,
        },
      });

      await tx.eventTicket.updateMany({
        where: { registrationId: registration.id },
        data: {
          status: TicketStatus.USED,
          checkedInAt: new Date(),
        },
      });
    });

    try {
      await this.walletService.creditCoins(
        registration.userId,
        COIN_CONSTANTS.ATTEND_EVENT_REWARD,
        CoinSource.EVENT_ATTENDANCE,
        `Attended: ${registration.event.title}`,
        {
          referenceId: registration.id,
          referenceType: 'EventRegistration',
        },
      );
    } catch (error) {
      this.logger.error(`Failed to award coins: ${error.message}`);
    }

    this.logger.log(
      `Checked in user ${registration.userId} for event ${registration.event.id}`,
    );

    return {
      success: true,
      checkedInAt: new Date(),
      attendee: registration.user,
      ticketType: registration.ticketType?.name || 'RSVP',
      coinsAwarded: COIN_CONSTANTS.ATTEND_EVENT_REWARD,
    };
  }

  private async checkInTicket(userId: string, ticket: any) {
    const registration = ticket.registration;

    const canManage = await this.canManageCheckin(
      userId,
      registration.event.spaceId,
    );

    if (!canManage) {
      throw new BadRequestException(
        'You are not authorized to check in attendees for this event',
      );
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Registration has been cancelled');
    }

    if (ticket.status === TicketStatus.USED) {
      return {
        alreadyCheckedIn: true,
        checkedInAt: ticket.checkedInAt,
        attendee: registration.user,
        ticketType: registration.ticketType?.name || 'RSVP',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.eventTicket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.USED,
          checkedInAt: new Date(),
        },
      });

      const allTickets = await tx.eventTicket.findMany({
        where: { registrationId: registration.id },
      });

      const allUsed = allTickets.every((t) => t.status === TicketStatus.USED);

      if (allUsed) {
        await tx.eventRegistration.update({
          where: { id: registration.id },
          data: {
            checkedInAt: new Date(),
            checkedInBy: userId,
            status: RegistrationStatus.ATTENDED,
          },
        });
      }
    });

    try {
      const existingReward = await this.prisma.walletTransaction.findFirst({
        where: {
          wallet: { userId: registration.userId },
          source: CoinSource.EVENT_ATTENDANCE,
          referenceId: registration.id,
        },
      });

      if (!existingReward) {
        await this.walletService.creditCoins(
          registration.userId,
          COIN_CONSTANTS.ATTEND_EVENT_REWARD,
          CoinSource.EVENT_ATTENDANCE,
          `Attended: ${registration.event.title}`,
          {
            referenceId: registration.id,
            referenceType: 'EventRegistration',
          },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to award coins: ${error.message}`);
    }

    this.logger.log(
      `Checked in ticket ${ticket.id} for user ${registration.userId}`,
    );

    return {
      success: true,
      checkedInAt: new Date(),
      attendee: registration.user,
      ticketType: registration.ticketType?.name || 'RSVP',
      coinsAwarded: COIN_CONSTANTS.ATTEND_EVENT_REWARD,
    };
  }

  async getEventRegistrationsForOffline(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageCheckin(userId, event.spaceId);

    if (!canManage) {
      throw new BadRequestException('Unauthorized');
    }

    // Try to get from cache first
    const cachedData = await this.cache.getEventRegistrationsForCheckin(eventId);
    if (cachedData) {
      return {
        eventId,
        eventTitle: event.title,
        registrations: cachedData,
        totalCount: cachedData.length,
        checkedInCount: cachedData.filter((r: any) => r.checkedInAt).length,
        fromCache: true,
      };
    }

    // Fetch from DB and cache
    const registrations = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: {
          in: [RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        ticketType: {
          select: {
            name: true,
          },
        },
        tickets: true,
      },
    });

    // Set cache for next time
    await this.cache.setEventRegistrationsForCheckin(eventId, registrations);

    return {
      eventId,
      eventTitle: event.title,
      registrations,
      totalCount: registrations.length,
      checkedInCount: registrations.filter((r) => r.checkedInAt).length,
      fromCache: false,
    };
  }

  async getCheckinStats(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageCheckin(userId, event.spaceId);

    if (!canManage) {
      throw new BadRequestException('Unauthorized');
    }

    const [total, checkedIn, cancelled] = await Promise.all([
      this.prisma.eventRegistration.count({
        where: {
          eventId,
          status: {
            in: [RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED],
          },
        },
      }),
      this.prisma.eventRegistration.count({
        where: {
          eventId,
          status: RegistrationStatus.ATTENDED,
        },
      }),
      this.prisma.eventRegistration.count({
        where: {
          eventId,
          status: RegistrationStatus.CANCELLED,
        },
      }),
    ]);

    return {
      total,
      checkedIn,
      remaining: total - checkedIn,
      cancelled,
      checkInRate: total > 0 ? ((checkedIn / total) * 100).toFixed(2) : 0,
    };
  }

  async bulkCheckin(userId: string, eventId: string, registrationIds: string[]) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageCheckin(userId, event.spaceId);

    if (!canManage) {
      throw new BadRequestException('Unauthorized');
    }

    const results: {
      success: Array<{ id: string; name: string | null }>;
      failed: Array<{ id: string; reason: string }>;
      alreadyCheckedIn: Array<{ id: string; name: string | null }>;
    } = {
      success: [],
      failed: [],
      alreadyCheckedIn: [],
    };

    for (const regId of registrationIds) {
      try {
        const registration = await this.prisma.eventRegistration.findUnique({
          where: { id: regId },
          include: { user: true },
        });

        if (!registration) {
          results.failed.push({ id: regId, reason: 'Not found' });
          continue;
        }

        if (registration.checkedInAt) {
          results.alreadyCheckedIn.push({
            id: regId,
            name: registration.user.fullName,
          });
          continue;
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.eventRegistration.update({
            where: { id: regId },
            data: {
              checkedInAt: new Date(),
              checkedInBy: userId,
              status: RegistrationStatus.ATTENDED,
            },
          });

          await tx.eventTicket.updateMany({
            where: { registrationId: regId },
            data: {
              status: TicketStatus.USED,
              checkedInAt: new Date(),
            },
          });
        });

        try {
          await this.walletService.creditCoins(
            registration.userId,
            COIN_CONSTANTS.ATTEND_EVENT_REWARD,
            CoinSource.EVENT_ATTENDANCE,
            `Attended: ${event.title}`,
            {
              referenceId: regId,
              referenceType: 'EventRegistration',
            },
          );
        } catch (error) {
          this.logger.error(`Failed to award coins: ${error.message}`);
        }

        results.success.push({
          id: regId,
          name: registration.user.fullName,
        });
      } catch (error) {
        results.failed.push({ id: regId, reason: error.message });
      }
    }

    this.logger.log(
      `Bulk check-in for event ${eventId}: ${results.success.length} success, ${results.failed.length} failed`,
    );

    return results;
  }
}
