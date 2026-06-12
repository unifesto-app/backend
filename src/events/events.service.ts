import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CacheService } from '../cache/cache.service';
import { EmailService } from '../email/email.service';
import { PLAN_LIMITS } from '../subscription/plan-limits.config';
import {
  EventStatus,
  RoleCode,
  SpaceStatus,
  SpaceType,
  Prisma,
} from '@prisma/client';
import {
  CancelEventDto,
  CreateAgendaDto,
  CreateEventDto,
  CreateFormFieldDto,
  CreateSpeakerDto,
  CreateTicketTypeDto,
  EventFilterDto,
  UpdateEventDto,
  UpdateTicketTypeDto,
} from './dto';
import slugify from 'slugify';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly subscriptionService: SubscriptionService,
    private readonly cache: CacheService,
    private readonly emailService: EmailService,
  ) {}

  async canManageEvent(userId: string, spaceId: string): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        spaceId,
        role: {
          code: {
            in: [RoleCode.ORGANISER, RoleCode.CO_ORGANISER],
          },
        },
      },
    });

    return userRoles.length > 0;
  }

  private generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.type === SpaceType.SUPER) {
      throw new BadRequestException('Cannot create events in SUPER spaces');
    }

    if (space.status !== SpaceStatus.APPROVED) {
      throw new BadRequestException('Space must be approved to create events');
    }

    const canManage = await this.canManageEvent(userId, dto.spaceId);
    if (!canManage) {
      throw new ForbiddenException(
        'You must be an organiser or co-organiser of this space',
      );
    }

    const subscription = await this.subscriptionService.getMySubscription(
      space.createdBy,
    );
    const limits = PLAN_LIMITS[subscription.plan];

    if (limits.eventsPerMonth !== null) {
      if (subscription.eventsThisMonth >= limits.eventsPerMonth) {
        throw new BadRequestException(
          `Event limit reached for ${subscription.plan} plan (${limits.eventsPerMonth}/month)`,
        );
      }
    }

    const slug = this.generateSlug(dto.title);

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        type: dto.type,
        registrationType: dto.registrationType,
        startDateTime: new Date(dto.startDateTime),
        endDateTime: new Date(dto.endDateTime),
        timezone: dto.timezone || 'Asia/Kolkata',
        venueName: dto.venueName,
        venueAddress: dto.venueAddress,
        city: dto.city,
        state: dto.state,
        country: dto.country || 'India',
        latitude: dto.latitude,
        longitude: dto.longitude,
        onlineUrl: dto.onlineUrl,
        onlinePlatform: dto.onlinePlatform,
        capacity: dto.capacity,
        waitlistEnabled: dto.waitlistEnabled || false,
        isFree: dto.isFree ?? true,
        tags: dto.tags || [],
        category: dto.category,
        visibility: dto.visibility,
        spaceId: dto.spaceId,
        createdBy: userId,
      },
    });

    this.logger.log(`Created event ${event.id} by user ${userId}`);

    return event;
  }

  async getEvents(filters: EventFilterDto) {
    const {
      city,
      type,
      category,
      startDate,
      endDate,
      search,
      spaceId,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
      visibility: 'PUBLIC',
    };

    if (spaceId) {
      where.spaceId = spaceId;
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (startDate) {
      where.startDateTime = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDateTime = { lte: new Date(endDate) };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDateTime: 'asc' },
        include: {
          space: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEventBySlug(slug: string) {
    // Check cache first
    const cachedEvent = await this.cache.getCachedEvent(slug);
    if (cachedEvent) {
      // Increment view count in background
      await this.cache.incrementEventViews(cachedEvent.id);
      return cachedEvent;
    }

    // Try to find by slug first, then fall back to ID
    let event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            visibility: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        ticketTypes: {
          where: { isVisible: true, isActive: true },
          orderBy: { order: 'asc' },
        },
        agenda: {
          orderBy: { order: 'asc' },
        },
        speakers: {
          orderBy: { order: 'asc' },
        },
        formFields: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // If not found by slug, try by ID (for backwards compatibility)
    if (!event) {
      event = await this.prisma.event.findUnique({
        where: { id: slug },
        include: {
          space: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              visibility: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatarUrl: true,
            },
          },
          ticketTypes: {
            where: { isVisible: true, isActive: true },
            orderBy: { order: 'asc' },
          },
          agenda: {
            orderBy: { order: 'asc' },
          },
          speakers: {
            orderBy: { order: 'asc' },
          },
          formFields: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });
    }

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Set cache and increment view count
    await this.cache.setCachedEvent(slug, event);
    await this.cache.incrementEventViews(event.id);

    return event;
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { space: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot manage this event');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cannot update cancelled event');
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startDateTime: dto.startDateTime
          ? new Date(dto.startDateTime)
          : undefined,
        endDateTime: dto.endDateTime ? new Date(dto.endDateTime) : undefined,
        venueName: dto.venueName,
        venueAddress: dto.venueAddress,
        city: dto.city,
        onlineUrl: dto.onlineUrl,
        capacity: dto.capacity,
        waitlistEnabled: dto.waitlistEnabled,
        tags: dto.tags,
        visibility: dto.visibility,
      },
    });

    // Invalidate event cache
    await this.cache.invalidateEventCache(event.slug);

    // Check if significant fields changed and notify registered attendees
    const significantChanges: { field: string; oldValue: string; newValue: string }[] = [];

    if (dto.startDateTime && updated.startDateTime.getTime() !== event.startDateTime.getTime()) {
      significantChanges.push({
        field: 'Date & Time',
        oldValue: this.formatEventDate(event.startDateTime),
        newValue: this.formatEventDate(updated.startDateTime),
      });
    }

    if (dto.venueName && updated.venueName !== event.venueName) {
      significantChanges.push({
        field: 'Venue',
        oldValue: event.venueName || 'TBD',
        newValue: updated.venueName || 'TBD',
      });
    }

    if (significantChanges.length > 0 && event.status === EventStatus.PUBLISHED) {
      // Notify all registered attendees (non-blocking)
      const registrations = await this.prisma.eventRegistration.findMany({
        where: { eventId, status: { not: 'CANCELLED' } },
        include: {
          user: {
            include: {
              identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
            },
          },
        },
      });

      for (const reg of registrations) {
        const attendeeEmail = reg.user.identities[0]?.email;
        if (attendeeEmail) {
          this.emailService
            .sendEventUpdated({
              email: attendeeEmail,
              userName: reg.user.fullName || reg.user.username || 'there',
              eventTitle: updated.title,
              changes: significantChanges,
              newDate: this.formatEventDate(updated.startDateTime),
              newTime: this.formatEventTime(updated.startDateTime, updated.endDateTime),
              newVenue: updated.venueName || undefined,
            })
            .catch((err) => this.logger.error('Failed to send event updated email', err));
        }
      }
    }

    return updated;
  }

  async deleteEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot delete this event');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft events');
    }

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  async publishEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { space: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot publish this event');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Event is already published');
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { space: true },
    });

    await this.subscriptionService.incrementEventUsage(event.space.createdBy);

    // Invalidate event cache
    await this.cache.invalidateEventCache(event.slug);

    this.logger.log(`Published event ${eventId}`);

    // Send event published emails to space members (non-blocking)
    const spaceMembers = await this.prisma.userRole.findMany({
      where: { spaceId: event.spaceId },
      include: {
        user: {
          include: {
            identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
          },
        },
      },
    });

    for (const member of spaceMembers) {
      const memberEmail = member.user.identities[0]?.email;
      if (memberEmail) {
        this.emailService
          .sendEventPublished({
            email: memberEmail,
            userName: member.user.fullName || member.user.username || 'there',
            eventTitle: updated.title,
            eventDate: this.formatEventDate(updated.startDateTime),
            eventTime: this.formatEventTime(updated.startDateTime, updated.endDateTime),
            venueName: updated.venueName || undefined,
            city: updated.city || undefined,
            isOnline: updated.type === 'ONLINE',
            spaceName: updated.space.name,
            registrationUrl: `https://unifesto.app/events/${updated.slug}`,
          })
          .catch((err) => this.logger.error('Failed to send event published email', err));
      }
    }

    return updated;
  }

  async cancelEvent(userId: string, eventId: string, dto: CancelEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot cancel this event');
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
    });

    // Invalidate event cache
    await this.cache.invalidateEventCache(event.slug);

    // Send cancellation emails to all registered attendees (non-blocking)
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId, status: { not: 'CANCELLED' } },
      include: {
        user: {
          include: {
            identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
          },
        },
      },
    });

    for (const reg of registrations) {
      const attendeeEmail = reg.user.identities[0]?.email;
      if (attendeeEmail) {
        const refundInfo =
          reg.coinsUsed > 0 || Number(reg.razorpayAmount) > 0
            ? 'Any payments or coins used will be refunded within 5-7 business days.'
            : undefined;

        this.emailService
          .sendEventCancelled({
            email: attendeeEmail,
            userName: reg.user.fullName || reg.user.username || 'there',
            eventTitle: event.title,
            eventDate: this.formatEventDate(event.startDateTime),
            cancellationReason: dto.reason || undefined,
            refundInfo,
          })
          .catch((err) => this.logger.error('Failed to send event cancelled email', err));
      }
    }

    return updated;
  }

  async uploadCoverImage(
    userId: string,
    eventId: string,
    file: Express.Multer.File,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot update this event');
    }

    const uploadResult = await this.storageService.uploadFile(
      file,
      'events/',
      eventId,
    );

    return this.prisma.event.update({
      where: { id: eventId },
      data: { coverImageUrl: uploadResult },
    });
  }

  async getSpaceEvents(spaceId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { spaceId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          _count: {
            select: { registrations: true },
          },
        },
      }),
      this.prisma.event.count({ where: { spaceId } }),
    ]);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTicketType(
    userId: string,
    eventId: string,
    dto: CreateTicketTypeDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        space: { include: { creator: { include: { subscription: true } } } },
        ticketTypes: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot manage this event');
    }

    const subscription = event.space.creator.subscription!;
    const limits = PLAN_LIMITS[subscription.plan];

    if (
      limits.ticketTypes !== null &&
      event.ticketTypes.length >= limits.ticketTypes
    ) {
      throw new BadRequestException(
        `Ticket type limit reached for ${subscription.plan} plan`,
      );
    }

    return this.prisma.eventTicketType.create({
      data: {
        eventId,
        name: dto.name,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        totalQuantity: dto.totalQuantity,
        saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : null,
        saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null,
        perUserLimit: dto.perUserLimit || 1,
        order: dto.order || 0,
      },
    });
  }

  async updateTicketType(
    userId: string,
    eventId: string,
    typeId: string,
    dto: UpdateTicketTypeDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot manage this event');
    }

    return this.prisma.eventTicketType.update({
      where: { id: typeId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price ? new Prisma.Decimal(dto.price) : undefined,
        totalQuantity: dto.totalQuantity,
        saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : undefined,
        saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : undefined,
        isVisible: dto.isVisible,
        isActive: dto.isActive,
      },
    });
  }

  async deleteTicketType(userId: string, eventId: string, typeId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot manage this event');
    }

    return this.prisma.eventTicketType.delete({
      where: { id: typeId },
    });
  }

  async createAgenda(userId: string, eventId: string, dto: CreateAgendaDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot manage this event');
    }

    return this.prisma.eventAgenda.create({
      data: {
        eventId,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        speakerName: dto.speakerName,
        order: dto.order || 0,
      },
    });
  }

  async createSpeaker(userId: string, eventId: string, dto: CreateSpeakerDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot manage this event');
    }

    return this.prisma.eventSpeaker.create({
      data: {
        eventId,
        name: dto.name,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        designation: dto.designation,
        company: dto.company,
        linkedinUrl: dto.linkedinUrl,
        order: dto.order || 0,
      },
    });
  }

  async createFormField(
    userId: string,
    eventId: string,
    dto: CreateFormFieldDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(userId, event.spaceId);
    if (!canManage) {
      throw new ForbiddenException('You cannot manage this event');
    }

    return this.prisma.eventFormField.create({
      data: {
        eventId,
        label: dto.label,
        type: dto.type,
        options: dto.options || [],
        isRequired: dto.isRequired || false,
        order: dto.order || 0,
      },
    });
  }

  /**
   * Helper: Format event date for display
   * Output: "7 June 2026"
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
   * Helper: Format event time range
   * Output: "10:00 AM - 1:00 PM IST"
   */
  private formatEventTime(
    startTime: Date,
    endTime: Date,
    timezone = 'Asia/Kolkata',
  ): string {
    const formatTime = (date: Date) =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(date);

    return `${formatTime(startTime)} - ${formatTime(endTime)} IST`;
  }
}
