"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const subscription_service_1 = require("../subscription/subscription.service");
const cache_service_1 = require("../cache/cache.service");
const email_service_1 = require("../email/email.service");
const plan_limits_config_1 = require("../subscription/plan-limits.config");
const chat_service_1 = require("../chat/chat.service");
const client_1 = require("@prisma/client");
const slugify_1 = __importDefault(require("slugify"));
let EventsService = EventsService_1 = class EventsService {
    prisma;
    storageService;
    subscriptionService;
    cache;
    emailService;
    chatService;
    logger = new common_1.Logger(EventsService_1.name);
    constructor(prisma, storageService, subscriptionService, cache, emailService, chatService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.subscriptionService = subscriptionService;
        this.cache = cache;
        this.emailService = emailService;
        this.chatService = chatService;
    }
    async canManageEvent(userId, spaceId) {
        const userRoles = await this.prisma.userRole.findMany({
            where: {
                userId,
                spaceId,
                role: {
                    code: {
                        in: [client_1.RoleCode.ORGANISER, client_1.RoleCode.CO_ORGANISER],
                    },
                },
            },
        });
        return userRoles.length > 0;
    }
    generateSlug(title) {
        const baseSlug = (0, slugify_1.default)(title, { lower: true, strict: true });
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `${baseSlug}-${randomSuffix}`;
    }
    async createEvent(userId, dto) {
        const space = await this.prisma.space.findUnique({
            where: { id: dto.spaceId },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        if (space.status !== client_1.SpaceStatus.APPROVED) {
            throw new common_1.BadRequestException('Space must be approved to create events');
        }
        const canManage = await this.canManageEvent(userId, dto.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You must be an organiser or co-organiser of this space');
        }
        const subscription = await this.subscriptionService.getMySubscription(space.createdBy);
        const limits = plan_limits_config_1.PLAN_LIMITS[subscription.plan];
        if (limits.eventsPerMonth !== null) {
            if (subscription.eventsThisMonth >= limits.eventsPerMonth) {
                throw new common_1.BadRequestException(`Event limit reached for ${subscription.plan} plan (${limits.eventsPerMonth}/month)`);
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
        try {
            await this.chatService.createGroupForEvent(event.id, event.spaceId, [
                userId,
            ]);
        }
        catch (err) {
            this.logger.error(`Failed to create chat group for event ${event.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
        return event;
    }
    async getEvents(filters) {
        const { city, type, category, startDate, endDate, search, spaceId, page = 1, limit = 20, } = filters;
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.EventStatus.PUBLISHED,
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
                    ticketTypes: {
                        where: { isVisible: true, isActive: true },
                        select: { price: true, currency: true },
                        orderBy: { price: 'asc' },
                        take: 1,
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
    async getEventBySlug(slug) {
        const cachedEvent = await this.cache.getCachedEvent(slug);
        if (cachedEvent) {
            await this.cache.incrementEventViews(cachedEvent.id);
            return cachedEvent;
        }
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
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        if (!event && isUuid) {
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
            throw new common_1.NotFoundException('Event not found');
        }
        await this.cache.setCachedEvent(slug, event);
        await this.cache.incrementEventViews(event.id);
        return event;
    }
    async updateEvent(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { space: true },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot manage this event');
        }
        if (event.status === client_1.EventStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot update cancelled event');
        }
        const updated = await this.prisma.event.update({
            where: { id: eventId },
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type,
                registrationType: dto.registrationType,
                startDateTime: dto.startDateTime
                    ? new Date(dto.startDateTime)
                    : undefined,
                endDateTime: dto.endDateTime ? new Date(dto.endDateTime) : undefined,
                timezone: dto.timezone,
                venueName: dto.venueName,
                venueAddress: dto.venueAddress,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                latitude: dto.latitude,
                longitude: dto.longitude,
                onlineUrl: dto.onlineUrl,
                onlinePlatform: dto.onlinePlatform,
                capacity: dto.capacity,
                waitlistEnabled: dto.waitlistEnabled,
                isFree: dto.isFree,
                tags: dto.tags,
                category: dto.category,
                visibility: dto.visibility,
            },
        });
        await this.cache.invalidateEventCache(event.slug);
        const significantChanges = [];
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
        if (significantChanges.length > 0 && event.status === client_1.EventStatus.PUBLISHED) {
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
    async deleteEvent(userId, eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot delete this event');
        }
        if (event.status !== client_1.EventStatus.DRAFT) {
            throw new common_1.BadRequestException('Can only delete draft events');
        }
        return this.prisma.event.delete({
            where: { id: eventId },
        });
    }
    async publishEvent(userId, eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { space: true },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot publish this event');
        }
        if (event.status !== client_1.EventStatus.DRAFT) {
            throw new common_1.BadRequestException('Event is already published');
        }
        const updated = await this.prisma.event.update({
            where: { id: eventId },
            data: {
                status: client_1.EventStatus.PUBLISHED,
                publishedAt: new Date(),
            },
            include: { space: true },
        });
        await this.subscriptionService.incrementEventUsage(event.space.createdBy);
        await this.cache.invalidateEventCache(event.slug);
        this.logger.log(`Published event ${eventId}`);
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
    async cancelEvent(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot cancel this event');
        }
        const updated = await this.prisma.event.update({
            where: { id: eventId },
            data: {
                status: client_1.EventStatus.CANCELLED,
                cancelledAt: new Date(),
                cancellationReason: dto.reason,
            },
        });
        await this.cache.invalidateEventCache(event.slug);
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
                const refundInfo = reg.coinsUsed > 0 || Number(reg.razorpayAmount) > 0
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
    async uploadCoverImage(userId, eventId, file) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot update this event');
        }
        const uploadResult = await this.storageService.uploadFile(file, 'events/', eventId);
        return this.prisma.event.update({
            where: { id: eventId },
            data: { coverImageUrl: uploadResult },
        });
    }
    async getSpaceEvents(spaceId, page = 1, limit = 20) {
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
    async createTicketType(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                space: { include: { creator: { include: { subscription: true } } } },
                ticketTypes: true,
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot manage this event');
        }
        const subscription = event.space.creator.subscription;
        const limits = plan_limits_config_1.PLAN_LIMITS[subscription.plan];
        if (limits.ticketTypes !== null &&
            event.ticketTypes.length >= limits.ticketTypes) {
            throw new common_1.BadRequestException(`Ticket type limit reached for ${subscription.plan} plan`);
        }
        return this.prisma.eventTicketType.create({
            data: {
                eventId,
                name: dto.name,
                description: dto.description,
                price: new client_1.Prisma.Decimal(dto.price),
                totalQuantity: dto.totalQuantity,
                saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : null,
                saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null,
                perUserLimit: dto.perUserLimit || 1,
                order: dto.order || 0,
            },
        });
    }
    async updateTicketType(userId, eventId, typeId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot manage this event');
        }
        return this.prisma.eventTicketType.update({
            where: { id: typeId },
            data: {
                name: dto.name,
                description: dto.description,
                price: dto.price ? new client_1.Prisma.Decimal(dto.price) : undefined,
                totalQuantity: dto.totalQuantity,
                saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : undefined,
                saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : undefined,
                isVisible: dto.isVisible,
                isActive: dto.isActive,
            },
        });
    }
    async deleteTicketType(userId, eventId, typeId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot manage this event');
        }
        return this.prisma.eventTicketType.delete({
            where: { id: typeId },
        });
    }
    async createAgenda(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot manage this event');
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
    async createSpeaker(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot manage this event');
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
    async createFormField(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageEvent(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You cannot manage this event');
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
    formatEventDate(dateTime, timezone = 'Asia/Kolkata') {
        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: timezone,
        }).format(dateTime);
    }
    formatEventTime(startTime, endTime, timezone = 'Asia/Kolkata') {
        const formatTime = (date) => new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone,
        }).format(date);
        return `${formatTime(startTime)} - ${formatTime(endTime)} IST`;
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        subscription_service_1.SubscriptionService,
        cache_service_1.CacheService,
        email_service_1.EmailService,
        chat_service_1.ChatService])
], EventsService);
//# sourceMappingURL=events.service.js.map