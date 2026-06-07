import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
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
import {
  RegisterForEventDto,
  VerifyRegistrationDto,
  CreateOrderDto,
  VerifyPaymentDto,
  OrderResponseDto,
  RegistrationResponseDto,
} from './dto';
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
    private readonly whatsappService: WhatsAppService,
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

  /**
   * Format event date for display
   * Output: "1 July 2026"
   */
  private formatEventDate(dateTime: Date, timezone = 'Asia/Kolkata'): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    }).format(dateTime);
  }

  /**
   * Format event time range
   * Output: "10:00 AM - 01:00 PM IST"
   */
  private formatEventTime(startTime: Date, endTime: Date, timezone = 'Asia/Kolkata'): string {
    const formatTime = (date: Date) =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(date);

    return `${formatTime(startTime)} - ${formatTime(endTime)} IST`;
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

    // Complete free registration (0 Razorpay amount)
    await this.prisma.$transaction(async (tx) => {
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      // Deduct coins if used
      if (coinsToUse > 0) {
        await this.walletService.debitCoins(
          userId,
          coinsToUse,
          CoinSource.EVENT_REGISTRATION,
          `Registration for ${event.title}`,
          {
            referenceId: registration.id,
            referenceType: 'EventRegistration',
          },
        );
      }

      // Increment counts
      await tx.event.update({
        where: { id: eventId },
        data: { registeredCount: { increment: dto.quantity || 1 } },
      });

      if (registration.ticketTypeId) {
        await tx.eventTicketType.update({
          where: { id: registration.ticketTypeId },
          data: { soldCount: { increment: dto.quantity || 1 } },
        });
      }

      // Generate tickets
      for (let i = 0; i < (dto.quantity || 1); i++) {
        await tx.eventTicket.create({
          data: {
            registrationId: registration.id,
            ticketCode: this.generateTicketCode(),
            qrCode: this.generateQRCode(),
          },
        });
      }
    });

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

    // Fetch full registration with user and event for notifications
    const fullRegistration = await this.prisma.eventRegistration.findUnique({
      where: { id: registration.id },
      include: {
        user: true,
        event: true,
      },
    });

    // Send WhatsApp notification
    try {
      if (fullRegistration?.user?.mobileNumber) {
        const eventDate = this.formatEventDate(fullRegistration.event.startDateTime);
        const eventTime = this.formatEventTime(
          fullRegistration.event.startDateTime,
          fullRegistration.event.endDateTime,
        );

        await this.whatsappService.sendRegistrationConfirmation(
          fullRegistration.user.mobileNumber,
          {
            userName: fullRegistration.user.fullName || fullRegistration.user.username || 'there',
            eventTitle: fullRegistration.event.title,
            eventDate,
            eventTime,
            venueName: fullRegistration.event.venueName || undefined,
            city: fullRegistration.event.city || undefined,
            isOnline: fullRegistration.event.type === 'ONLINE',
            onlineUrl: fullRegistration.event.onlineUrl || undefined,
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send RSVP WhatsApp notification', error);
    }

    // Send email notification (non-blocking)
    const identity = await this.prisma.userIdentity.findFirst({
      where: { userId, email: { not: null } },
      select: { email: true },
    });

    if (identity?.email && fullRegistration) {
      const eventDate = this.formatEventDate(fullRegistration.event.startDateTime);
      const eventTime = this.formatEventTime(
        fullRegistration.event.startDateTime,
        fullRegistration.event.endDateTime,
      );

      this.emailService.sendRegistrationConfirmation({
        email: identity.email,
        userName: fullRegistration.user.fullName || fullRegistration.user.username || 'there',
        eventTitle: fullRegistration.event.title,
        eventDate,
        eventTime,
        venueName: fullRegistration.event.venueName || undefined,
        city: fullRegistration.event.city || undefined,
        isOnline: fullRegistration.event.type === 'ONLINE',
        onlineUrl: fullRegistration.event.onlineUrl || undefined,
        qrCode: fullRegistration.qrCode,
        ticketCode: undefined,
      }).catch(err => this.logger.error('Failed to send registration confirmation email', err));
    }

    this.logger.log(`RSVP completed for user ${userId}, event ${eventId}`);

    return {
      registrationId: registration.id,
      message: 'RSVP successful',
      qrCode: registration.qrCode,
    };
  }

  async addToWaitlist(userId: string, eventId: string, dto: RegisterForEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        space: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

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

    // Send waitlist confirmation email (non-blocking)
    const identity = await this.prisma.userIdentity.findFirst({
      where: { userId, email: { not: null } },
      select: { email: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, username: true },
    });

    if (identity?.email && user) {
      const waitlistPosition = await this.prisma.eventRegistration.count({
        where: { eventId, isWaitlisted: true },
      });

      this.emailService
        .sendWaitlistConfirmation({
          email: identity.email,
          userName: user.fullName || user.username || 'there',
          eventTitle: event.title,
          eventDate: this.formatEventDate(event.startDateTime),
          waitlistPosition,
        })
        .catch((err) => this.logger.error('Failed to send waitlist confirmation email', err));
    }

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

  // =====================================================
  // NEW PAYMENT METHODS
  // =====================================================

  /**
   * Create payment order for paid event registration
   */
  async createPaymentOrder(
    eventId: string,
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
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

    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('Event is not open for registration');
    }

    if (event.registrations.length > 0) {
      throw new BadRequestException('You are already registered for this event');
    }

    // Get and validate ticket type
    const ticketType = event.ticketTypes.find((t) => t.id === dto.ticketTypeId);
    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    if (!ticketType.isActive || !ticketType.isVisible) {
      throw new BadRequestException('Ticket type not available');
    }

    // Check availability
    if (ticketType.soldCount + dto.quantity > ticketType.totalQuantity) {
      throw new BadRequestException('Not enough tickets available');
    }

    if (dto.quantity > ticketType.perUserLimit) {
      throw new BadRequestException(
        `Maximum ${ticketType.perUserLimit} tickets per user`,
      );
    }

    // Calculate amounts
    const baseAmount = Number(ticketType.price) * dto.quantity;
    const subscription = event.space.creator.subscription!;
    const planLimits = PLAN_LIMITS[subscription.plan];
    const feePercent = planLimits.processingFeePercent;
    const processingFee = (baseAmount * feePercent) / 100;
    const totalAmount = baseAmount + processingFee;

    const coinsToUse = dto.coinsToUse || 0;
    let coinValueINR = 0;
    let razorpayAmount = totalAmount;

    // Validate coins balance if using coins
    if (coinsToUse > 0) {
      const wallet = await this.walletService.getWallet(userId);
      if (wallet.balance < coinsToUse) {
        throw new BadRequestException('Insufficient coin balance');
      }
      coinValueINR = coinsToINR(coinsToUse);
      razorpayAmount = Math.max(0, totalAmount - coinValueINR);
    }

    // Create pending registration
    const qrCode = this.generateQRCode();
    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        ticketTypeId: dto.ticketTypeId,
        quantity: dto.quantity,
        totalAmount: new Prisma.Decimal(totalAmount),
        coinsUsed: coinsToUse,
        coinValueINR: new Prisma.Decimal(coinValueINR),
        razorpayAmount: new Prisma.Decimal(razorpayAmount),
        processingFee: new Prisma.Decimal(processingFee),
        paymentStatus: PaymentStatus.PENDING,
        status: RegistrationStatus.REGISTERED,
        qrCode,
        formResponses: dto.formResponses || {},
      },
    });

    // Create Razorpay order (convert to paise)
    const order = await this.razorpay.orders.create({
      amount: Math.round(razorpayAmount * 100),
      currency: 'INR',
      receipt: `reg_${registration.id}`,
      notes: {
        registrationId: registration.id,
        eventId,
        userId,
      },
    });

    // Update registration with order ID
    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { orderId: order.id },
    });

    // Cache order mapping in Redis (TTL 30 minutes)
    const client = this.cache['redis'].getClient();
    if (client) {
      await client.set(`order:${order.id}`, registration.id, 'EX', 1800);
    }

    this.logger.log(
      `Created Razorpay order ${order.id} for registration ${registration.id}`,
    );

    return {
      registrationId: registration.id,
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID!,
      amount: Math.round(razorpayAmount * 100), // in paise
      currency: 'INR',
      breakdown: {
        baseAmount,
        processingFee,
        coinsUsed: coinsToUse,
        coinValueINR,
        razorpayAmount,
        totalAmount,
      },
    };
  }

  /**
   * Verify Razorpay payment and complete registration
   */
  async verifyPayment(
    eventId: string,
    userId: string,
    dto: VerifyPaymentDto,
  ): Promise<RegistrationResponseDto> {
    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Get pending registration
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: dto.registrationId },
      include: {
        event: {
          include: {
            space: true,
          },
        },
        user: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (registration.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already completed');
    }

    // Complete registration in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update registration
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentId: dto.razorpayPaymentId,
          orderId: dto.razorpayOrderId,
          paidAt: new Date(),
        },
      });

      // Deduct coins from wallet if used
      if (registration.coinsUsed > 0) {
        await this.walletService.debitCoins(
          userId,
          registration.coinsUsed,
          CoinSource.EVENT_REGISTRATION,
          `Registration for ${registration.event.title}`,
          {
            referenceId: registration.id,
            referenceType: 'EventRegistration',
          },
        );
      }

      // Increment ticket soldCount atomically
      if (registration.ticketTypeId) {
        await tx.eventTicketType.update({
          where: { id: registration.ticketTypeId },
          data: { soldCount: { increment: registration.quantity } },
        });
      }

      // Increment event registeredCount
      await tx.event.update({
        where: { id: eventId },
        data: { registeredCount: { increment: registration.quantity } },
      });

      // Generate QR codes for each ticket
      for (let i = 0; i < registration.quantity; i++) {
        await tx.eventTicket.create({
          data: {
            registrationId: registration.id,
            ticketCode: this.generateTicketCode(),
            qrCode: this.generateQRCode(),
          },
        });
      }
    });

    // Get updated registration with tickets
    const updatedRegistration = await this.prisma.eventRegistration.findUnique({
      where: { id: registration.id },
      include: {
        tickets: true,
        event: true,
        user: {
          include: {
            identities: true,
          },
        },
      },
    });

    // Clear Redis order cache
    const client = this.cache['redis'].getClient();
    if (client) {
      await client.del(`order:${dto.razorpayOrderId}`);
    }

    // Send notifications (don't let failures break the flow)
    try {
      // WhatsApp notification
      if (registration.user.mobileNumber) {
        await this.whatsappService.sendPaymentConfirmation(
          registration.user.mobileNumber,
          {
            userName: registration.user.fullName || registration.user.username || 'there',
            eventTitle: registration.event.title,
            amount: Number(registration.razorpayAmount),
            coinsUsed: registration.coinsUsed > 0 ? registration.coinsUsed : undefined,
            ticketCode: updatedRegistration!.tickets[0]?.ticketCode || registration.qrCode,
          },
        );

        // Format dates for registration confirmation
        const eventDate = new Date(registration.event.startDateTime).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        const startTime = new Date(registration.event.startDateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        const endTime = new Date(registration.event.endDateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        await this.whatsappService.sendRegistrationConfirmation(
          registration.user.mobileNumber,
          {
            userName: registration.user.fullName || registration.user.username || 'there',
            eventTitle: registration.event.title,
            eventDate,
            eventTime: `${startTime} - ${endTime} IST`,
            venueName: registration.event.venueName || undefined,
            city: registration.event.city || undefined,
            isOnline: registration.event.type === 'ONLINE',
            onlineUrl: registration.event.onlineUrl || undefined,
          },
        );
      }

      // Email notifications (non-blocking)
      const userEmail = updatedRegistration?.user?.identities?.[0]?.email;
      if (userEmail) {
        const eventDate = this.formatEventDate(registration.event.startDateTime);
        const eventTime = this.formatEventTime(
          registration.event.startDateTime,
          registration.event.endDateTime,
        );

        // Send payment confirmation
        this.emailService.sendPaymentConfirmation({
          email: userEmail,
          userName: registration.user.fullName || registration.user.username || 'there',
          eventTitle: registration.event.title,
          eventDate,
          eventTime,
          venueName: registration.event.venueName || undefined,
          city: registration.event.city || undefined,
          isOnline: registration.event.type === 'ONLINE',
          onlineUrl: registration.event.onlineUrl || undefined,
          amount: Number(registration.totalAmount) - Number(registration.processingFee),
          processingFee: Number(registration.processingFee),
          coinsUsed: registration.coinsUsed > 0 ? registration.coinsUsed : undefined,
          coinValueINR: registration.coinsUsed > 0 ? Number(registration.coinValueINR) : undefined,
          razorpayPaymentId: dto.razorpayPaymentId,
          ticketCode: updatedRegistration!.tickets[0]?.ticketCode || undefined,
          qrCode: registration.qrCode,
        }).catch(err => this.logger.error('Failed to send payment confirmation email', err));

        // Send registration confirmation
        this.emailService.sendRegistrationConfirmation({
          email: userEmail,
          userName: registration.user.fullName || registration.user.username || 'there',
          eventTitle: registration.event.title,
          eventDate,
          eventTime,
          venueName: registration.event.venueName || undefined,
          city: registration.event.city || undefined,
          isOnline: registration.event.type === 'ONLINE',
          onlineUrl: registration.event.onlineUrl || undefined,
          qrCode: registration.qrCode,
          ticketCode: updatedRegistration!.tickets[0]?.ticketCode || undefined,
        }).catch(err => this.logger.error('Failed to send registration confirmation email', err));
      }
    } catch (error) {
      this.logger.error('Failed to send notification after payment', error);
    }

    // Invalidate check-in cache
    await this.cache.invalidateCheckinCache(eventId);

    // Increment trending events score
    await this.cache.incrementEventScore(eventId);

    this.logger.log(`Payment verified for registration ${registration.id}`);

    return {
      registrationId: registration.id,
      message: 'Payment verified, registration complete',
      qrCode: registration.qrCode,
      tickets: updatedRegistration!.tickets,
    };
  }

  /**
   * Handle Razorpay webhook events
   */
  async handleRazorpayWebhook(payload: any, signature: string) {
    // Verify webhook signature
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

      // Get registrationId from Redis cache
      const client = this.cache['redis'].getClient();
      const registrationId = client ? await client.get(`order:${orderId}`) : null;

      if (!registrationId) {
        this.logger.warn(`No registration found in cache for order ${orderId}`);
        // Try to find in DB
        const registration = await this.prisma.eventRegistration.findFirst({
          where: { orderId },
        });

        if (!registration) {
          this.logger.error(`No registration found for order ${orderId}`);
          return { received: true };
        }

        if (registration.paymentStatus === PaymentStatus.PAID) {
          this.logger.log(`Registration ${registration.id} already paid`);
          return { received: true };
        }

        // Complete payment
        await this.completeWebhookPayment(registration.id, paymentId, orderId);
      } else {
        // Check if already processed (idempotency)
        const registration = await this.prisma.eventRegistration.findUnique({
          where: { id: registrationId },
        });

        if (registration && registration.paymentStatus === PaymentStatus.PENDING) {
          await this.completeWebhookPayment(registrationId, paymentId, orderId);
        } else {
          this.logger.log(`Registration ${registrationId} already processed`);
        }
      }
    } else if (event === 'payment.failed') {
      const orderId = paymentData.order_id;

      const registration = await this.prisma.eventRegistration.findFirst({
        where: { orderId },
        include: {
          event: true,
          user: {
            include: {
              identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
            },
          },
        },
      });

      if (registration && registration.paymentStatus === PaymentStatus.PENDING) {
        await this.prisma.eventRegistration.update({
          where: { id: registration.id },
          data: { paymentStatus: PaymentStatus.FAILED },
        });

        this.logger.log(`Payment failed for registration ${registration.id}`);

        // Send payment failed email (non-blocking)
        const userEmail = registration.user.identities[0]?.email;
        if (userEmail) {
          this.emailService
            .sendPaymentFailed({
              email: userEmail,
              userName: registration.user.fullName || registration.user.username || 'there',
              eventTitle: registration.event.title,
              amount: Number(registration.razorpayAmount),
              reason: 'Payment was declined. Please try again.',
              retryUrl: `https://unifesto.app/events/${registration.event.slug}`,
            })
            .catch((err) => this.logger.error('Failed to send payment failed email', err));
        }
      }
    }

    return { received: true };
  }

  /**
   * Complete payment from webhook
   */
  private async completeWebhookPayment(
    registrationId: string,
    paymentId: string,
    orderId: string,
  ): Promise<void> {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!registration) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      // Update registration
      await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentId,
          paidAt: new Date(),
        },
      });

      // Deduct coins
      if (registration.coinsUsed > 0) {
        await this.walletService.debitCoins(
          registration.userId,
          registration.coinsUsed,
          CoinSource.EVENT_REGISTRATION,
          `Registration for ${registration.event.title}`,
          {
            referenceId: registration.id,
            referenceType: 'EventRegistration',
          },
        );
      }

      // Increment counts
      if (registration.ticketTypeId) {
        await tx.eventTicketType.update({
          where: { id: registration.ticketTypeId },
          data: { soldCount: { increment: registration.quantity } },
        });
      }

      await tx.event.update({
        where: { id: registration.eventId },
        data: { registeredCount: { increment: registration.quantity } },
      });

      // Generate tickets
      for (let i = 0; i < registration.quantity; i++) {
        await tx.eventTicket.create({
          data: {
            registrationId: registration.id,
            ticketCode: this.generateTicketCode(),
            qrCode: this.generateQRCode(),
          },
        });
      }
    });

    // Send notifications
    try {
      if (registration.user.mobileNumber) {
        const eventDate = new Date(registration.event.startDateTime).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        const startTime = new Date(registration.event.startDateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        const endTime = new Date(registration.event.endDateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        const tickets = await this.prisma.eventTicket.findMany({
          where: { registrationId: registration.id },
        });

        await this.whatsappService.sendRegistrationConfirmation(
          registration.user.mobileNumber,
          {
            userName: registration.user.fullName || registration.user.username || 'there',
            eventTitle: registration.event.title,
            eventDate,
            eventTime: `${startTime} - ${endTime} IST`,
            venueName: registration.event.venueName || undefined,
            city: registration.event.city || undefined,
            isOnline: registration.event.type === 'ONLINE',
            onlineUrl: registration.event.onlineUrl || undefined,
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send notification from webhook', error);
    }

    // Clear cache
    const client = this.cache['redis'].getClient();
    if (client) {
      await client.del(`order:${orderId}`);
    }
    await this.cache.invalidateCheckinCache(registration.eventId);

    this.logger.log(`Webhook processed payment for registration ${registrationId}`);
  }

  /**
   * Cancel registration with refund
   */
  async cancelRegistration(eventId: string, userId: string): Promise<any> {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      include: {
        event: true,
        user: true,
      },
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

    let razorpayRefundInitiated = false;

    await this.prisma.$transaction(async (tx) => {
      // Update registration status
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: RegistrationStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Decrement counts
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

      // Cancel tickets
      await tx.eventTicket.updateMany({
        where: { registrationId: registration.id },
        data: { status: TicketStatus.CANCELLED },
      });

      // Refund coins immediately if used
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
    });

    // Initiate Razorpay refund if payment was made
    if (
      Number(registration.razorpayAmount) > 0 &&
      registration.paymentId &&
      registration.paymentStatus === PaymentStatus.PAID
    ) {
      try {
        await this.razorpay.payments.refund(registration.paymentId, {
          amount: Math.round(Number(registration.razorpayAmount) * 100),
        });
        razorpayRefundInitiated = true;
        this.logger.log(`Razorpay refund initiated for registration ${registration.id}`);
      } catch (error) {
        this.logger.error(`Razorpay refund failed: ${error.message}`);
      }
    }

    // Send WhatsApp notification
    try {
      if (registration.user.mobileNumber) {
        await this.whatsappService.sendCancellationNotification(
          registration.user.mobileNumber,
          {
            userName: registration.user.fullName || registration.user.username || 'there',
            eventTitle: registration.event.title,
            coinsRefunded: registration.coinsUsed > 0 ? registration.coinsUsed : undefined,
            razorpayRefundInitiated,
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to send cancellation notification', error);
    }

    // Send email notification (non-blocking)
    const identity = await this.prisma.userIdentity.findFirst({
      where: { userId, email: { not: null } },
      select: { email: true },
    });

    if (identity?.email) {
      this.emailService.sendCancellationConfirmation({
        email: identity.email,
        userName: registration.user.fullName || registration.user.username || 'there',
        eventTitle: registration.event.title,
        coinsRefunded: registration.coinsUsed > 0 ? registration.coinsUsed : undefined,
        razorpayRefundInitiated,
        razorpayRefundAmount: razorpayRefundInitiated ? Number(registration.razorpayAmount) : undefined,
      }).catch(err => this.logger.error('Failed to send cancellation confirmation email', err));
    }

    // Invalidate cache
    await this.cache.invalidateCheckinCache(eventId);

    this.logger.log(`Cancelled registration ${registration.id}`);

    return {
      message: 'Registration cancelled successfully',
      coinsRefunded: registration.coinsUsed,
      razorpayRefundInitiated,
    };
  }
}
