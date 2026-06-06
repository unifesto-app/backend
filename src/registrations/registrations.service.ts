import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { CacheService } from '../cache/cache.service';
import { PLAN_LIMITS } from '../subscription/plan-limits.config';
import { coinsToINR } from '../wallet/coin.constants';
import {
  CoinSource,
  PaymentStatus,
  RegistrationStatus,
  Prisma,
  TicketStatus,
} from '@prisma/client';
import { RegisterForEventDto, VerifyRegistrationDto } from './dto';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);
  private razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly emailService: EmailService,
    private readonly cache: CacheService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  private generateQRCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateTicketCode(): string {
    return crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase();
  }

  async registerForEvent(userId: string, eventId: string, dto: RegisterForEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        space: {
          include: {
            creator: {
              include: { subscription: true },
            },
          },
        },
        ticketTypes: true,
        registrations: {
          where: { userId },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.registrations.length > 0) {
      throw new BadRequestException('You are already registered for this event');
    }

    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('Event is not open for registration');
    }

    const quantity = dto.quantity || 1;

    if (event.capacity && event.registeredCount + quantity > event.capacity) {
      if (event.waitlistEnabled) {
        return this.addToWaitlist(userId, eventId, dto);
      }
      throw new BadRequestException('Event is fully booked');
    }

    let ticketType: any = null;
    if (dto.ticketTypeId) {
      ticketType = event.ticketTypes.find((t) => t.id === dto.ticketTypeId);
      if (!ticketType) {
        throw new NotFoundException('Ticket type not found');
      }

      if (!ticketType.isActive || !ticketType.isVisible) {
        throw new BadRequestException('Ticket type not available');
      }

      // Try to reserve tickets
      const reserved = await this.cache.reserveTickets(
        eventId,
        dto.ticketTypeId,
        userId,
        quantity,
      );

      if (!reserved) {
        // Check actual availability in DB
        if (ticketType.soldCount + quantity > ticketType.totalQuantity) {
          throw new BadRequestException('Not enough tickets available');
        }
      }

      if (quantity > ticketType.perUserLimit) {
        throw new BadRequestException(
          `Maximum ${ticketType.perUserLimit} tickets per user`,
        );
      }
    }

    const basePrice = ticketType
      ? Number(ticketType.price) * quantity
      : 0;

    const subscription = event.space.creator.subscription!;
    const planLimits = PLAN_LIMITS[subscription.plan];
    const processingFeePercent = planLimits.processingFeePercent;
    const processingFee = (basePrice * processingFeePercent) / 100;

    const totalAmount = basePrice + processingFee;

    const coinsToUse = dto.coinsToUse || 0;
    let coinValueINR = 0;
    let razorpayAmount = totalAmount;

    if (coinsToUse > 0) {
      const wallet = await this.walletService.getWallet(userId);
      if (wallet.balance < coinsToUse) {
        throw new BadRequestException('Insufficient coin balance');
      }

      coinValueINR = coinsToINR(coinsToUse);
      razorpayAmount = Math.max(0, totalAmount - coinValueINR);
    }

    if (razorpayAmount === 0 && coinsToUse === 0) {
      return this.completeRSVP(userId, eventId, dto, event);
    }

    const qrCode = this.generateQRCode();

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        ticketTypeId: dto.ticketTypeId,
        quantity,
        totalAmount: new Prisma.Decimal(totalAmount),
        coinsUsed: coinsToUse,
        coinValueINR: new Prisma.Decimal(coinValueINR),
        razorpayAmount: new Prisma.Decimal(razorpayAmount),
        processingFee: new Prisma.Decimal(processingFee),
        paymentStatus: razorpayAmount > 0 ? PaymentStatus.PENDING : PaymentStatus.PAID,
        qrCode,
        formResponses: dto.formResponses || {},
      },
    });

    if (razorpayAmount > 0) {
      return {
        registrationId: registration.id,
        needsPayment: true,
        razorpayAmount,
        coinsUsed: coinsToUse,
        coinValueINR,
        totalAmount,
        processingFee,
      };
    }

    await this.finalizeRegistration(registration.id, userId, coinsToUse);

    return {
      registrationId: registration.id,
      needsPayment: false,
      message: 'Registration successful',
    };
  }

  async completeRSVP(userId: string, eventId: string, dto: RegisterForEventDto, event: any) {
    const qrCode = this.generateQRCode();

    const registration = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.eventRegistration.create({
        data: {
          eventId,
          userId,
          ticketTypeId: dto.ticketTypeId,
          quantity: dto.quantity || 1,
          totalAmount: new Prisma.Decimal(0),
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
          qrCode,
          formResponses: dto.formResponses || {},
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { registeredCount: { increment: dto.quantity || 1 } },
      });

      if (dto.ticketTypeId) {
        await tx.eventTicketType.update({
          where: { id: dto.ticketTypeId },
          data: { soldCount: { increment: dto.quantity || 1 } },
        });
      }

      for (let i = 0; i < (dto.quantity || 1); i++) {
        await tx.eventTicket.create({
          data: {
            registrationId: reg.id,
            ticketCode: this.generateTicketCode(),
            qrCode: this.generateQRCode(),
          },
        });
      }

      return reg;
    });

    const creatorEmail = event.space?.creator?.identities?.[0]?.email;
    if (creatorEmail) {
      await this.emailService.sendOtpEmail(
        creatorEmail,
        `You have successfully registered for ${event.title}`,
      );
    }

    this.logger.log(`RSVP completed for user ${userId}, event ${eventId}`);

    return {
      registrationId: registration.id,
      message: 'RSVP successful',
      qrCode: registration.qrCode,
    };
  }

  async addToWaitlist(userId: string, eventId: string, dto: RegisterForEventDto) {
    const qrCode = this.generateQRCode();

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        ticketTypeId: dto.ticketTypeId,
        quantity: dto.quantity || 1,
        totalAmount: new Prisma.Decimal(0),
        paymentStatus: PaymentStatus.PENDING,
        isWaitlisted: true,
        qrCode,
        formResponses: dto.formResponses || {},
      },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { waitlistCount: { increment: 1 } },
    });

    return {
      registrationId: registration.id,
      isWaitlisted: true,
      message: 'Added to waitlist',
    };
  }

  async createRazorpayOrder(userId: string, registrationId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (registration.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already processed');
    }

    const order = await this.razorpay.orders.create({
      amount: Number(registration.razorpayAmount) * 100,
      currency: 'INR',
      receipt: `reg_${registrationId}`,
      notes: {
        registrationId,
        userId,
        eventId: registration.eventId,
      },
    });

    await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { orderId: order.id },
    });

    this.logger.log(`Created Razorpay order ${order.id} for registration ${registrationId}`);

    return {
      orderId: order.id,
      amount: Number(registration.razorpayAmount),
      currency: 'INR',
    };
  }

  async verifyPayment(userId: string, registrationId: string, dto: VerifyRegistrationDto) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${dto.orderId}|${dto.paymentId}`)
      .digest('hex');

    if (signature !== dto.signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    await this.finalizeRegistration(registrationId, userId, registration.coinsUsed);

    return {
      message: 'Payment verified, registration complete',
      registrationId,
      qrCode: registration.qrCode,
    };
  }

  private async finalizeRegistration(registrationId: string, userId: string, coinsUsed: number) {
    await this.prisma.$transaction(async (tx) => {
      const registration = await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
          status: RegistrationStatus.REGISTERED,
        },
        include: { event: true },
      });

      await tx.event.update({
        where: { id: registration.eventId },
        data: { registeredCount: { increment: registration.quantity } },
      });

      if (registration.ticketTypeId) {
        await tx.eventTicketType.update({
          where: { id: registration.ticketTypeId },
          data: { soldCount: { increment: registration.quantity } },
        });
      }

      if (coinsUsed > 0) {
        await this.walletService.debitCoins(
          userId,
          coinsUsed,
          CoinSource.EVENT_REGISTRATION,
          `Registration for ${registration.event.title}`,
          {
            referenceId: registrationId,
            referenceType: 'EventRegistration',
          },
        );
      }

      for (let i = 0; i < registration.quantity; i++) {
        await tx.eventTicket.create({
          data: {
            registrationId,
            ticketCode: this.generateTicketCode(),
            qrCode: this.generateQRCode(),
          },
        });
      }
    });

    // Release ticket lock if any
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      select: { eventId: true, ticketTypeId: true, userId: true },
    });

    if (registration?.ticketTypeId) {
      await this.cache.releaseTicketLock(
        registration.eventId,
        registration.ticketTypeId,
        registration.userId,
      );
    }

    // Invalidate check-in cache for offline mode
    await this.cache.invalidateCheckinCache(registration!.eventId);

    // Increment trending events score
    await this.cache.incrementEventScore(registration!.eventId);

    this.logger.log(`Finalized registration ${registrationId}`);
  }

  async getMyRegistration(userId: string, eventId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDateTime: true,
            endDateTime: true,
            venueName: true,
            city: true,
          },
        },
        ticketType: true,
        tickets: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  async cancelRegistration(userId: string, eventId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      include: { event: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Registration already cancelled');
    }

    if (registration.event.startDateTime < new Date()) {
      throw new BadRequestException('Cannot cancel past event registration');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: RegistrationStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { registeredCount: { decrement: registration.quantity } },
      });

      if (registration.ticketTypeId) {
        await tx.eventTicketType.update({
          where: { id: registration.ticketTypeId },
          data: { soldCount: { decrement: registration.quantity } },
        });
      }

      await tx.eventTicket.updateMany({
        where: { registrationId: registration.id },
        data: { status: TicketStatus.CANCELLED },
      });

      if (registration.coinsUsed > 0) {
        await this.walletService.creditCoins(
          userId,
          registration.coinsUsed,
          CoinSource.REFUND,
          `Refund for cancelled registration: ${registration.event.title}`,
          {
            referenceId: registration.id,
            referenceType: 'EventRegistration',
          },
        );
      }

      if (Number(registration.razorpayAmount) > 0 && registration.paymentId) {
        try {
          await this.razorpay.payments.refund(registration.paymentId, {
            amount: Number(registration.razorpayAmount) * 100,
          });
        } catch (error) {
          this.logger.error(`Razorpay refund failed: ${error.message}`);
        }
      }
    });

    // Invalidate check-in cache
    await this.cache.invalidateCheckinCache(eventId);

    this.logger.log(`Cancelled registration ${registration.id}`);

    return { message: 'Registration cancelled successfully' };
  }

  async getEventRegistrations(userId: string, eventId: string, page = 1, limit = 50) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        spaceId: event.spaceId,
        role: {
          code: {
            in: ['ORGANISER', 'CO_ORGANISER'],
          },
        },
      },
    });

    if (userRoles.length === 0) {
      throw new BadRequestException('Unauthorized');
    }

    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      this.prisma.eventRegistration.findMany({
        where: { eventId },
        skip,
        take: limit,
        orderBy: { registeredAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              mobileNumber: true,
            },
          },
          ticketType: true,
          tickets: true,
        },
      }),
      this.prisma.eventRegistration.count({ where: { eventId } }),
    ]);

    return {
      data: registrations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportRegistrations(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        space: {
          include: {
            creator: {
              include: { subscription: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const subscription = event.space.creator.subscription;
    if (!subscription) {
      throw new BadRequestException('Organiser has no subscription');
    }
    const planLimits = PLAN_LIMITS[subscription.plan];
    if (!planLimits.hasBulkExport) {
      throw new BadRequestException('Bulk export not available in your plan');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        spaceId: event.spaceId,
        role: {
          code: {
            in: ['ORGANISER', 'CO_ORGANISER'],
          },
        },
      },
    });

    if (userRoles.length === 0) {
      throw new BadRequestException('Unauthorized');
    }

    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
            mobileNumber: true,
          },
        },
        ticketType: true,
      },
    });

    const csv = [
      ['Name', 'Username', 'Mobile', 'Ticket Type', 'Quantity', 'Status', 'Registered At', 'Checked In'],
      ...registrations.map((reg) => [
        reg.user.fullName || '',
        reg.user.username || '',
        reg.user.mobileNumber || '',
        reg.ticketType?.name || 'RSVP',
        reg.quantity.toString(),
        reg.status,
        reg.registeredAt.toISOString(),
        reg.checkedInAt ? 'Yes' : 'No',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    return {
      csv,
      filename: `${event.slug}-registrations.csv`,
    };
  }

  async getMyRegistrations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      this.prisma.eventRegistration.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { registeredAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
              startDateTime: true,
              endDateTime: true,
              venueName: true,
              city: true,
              type: true,
            },
          },
          ticketType: true,
        },
      }),
      this.prisma.eventRegistration.count({ where: { userId } }),
    ]);

    return {
      data: registrations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async handleRazorpayWebhook(payload: any, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event;
    const paymentData = payload.payload.payment.entity;

    if (event === 'payment.captured') {
      const orderId = paymentData.order_id;
      const paymentId = paymentData.id;

      const registration = await this.prisma.eventRegistration.findFirst({
        where: { orderId },
      });

      if (registration && registration.paymentStatus === PaymentStatus.PENDING) {
        await this.prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            paymentId,
            paidAt: new Date(),
          },
        });

        await this.finalizeRegistration(
          registration.id,
          registration.userId,
          registration.coinsUsed,
        );

        this.logger.log(`Webhook processed payment for registration ${registration.id}`);
      }
    }

    return { received: true };
  }
}
