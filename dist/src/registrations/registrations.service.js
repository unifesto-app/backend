"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RegistrationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const email_service_1 = require("../email/email.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const cache_service_1 = require("../cache/cache.service");
const plan_limits_config_1 = require("../subscription/plan-limits.config");
const coin_constants_1 = require("../wallet/coin.constants");
const chat_service_1 = require("../chat/chat.service");
const client_1 = require("@prisma/client");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
let RegistrationsService = RegistrationsService_1 = class RegistrationsService {
    prisma;
    walletService;
    emailService;
    whatsappService;
    cache;
    chatService;
    logger = new common_1.Logger(RegistrationsService_1.name);
    razorpay;
    constructor(prisma, walletService, emailService, whatsappService, cache, chatService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.emailService = emailService;
        this.whatsappService = whatsappService;
        this.cache = cache;
        this.chatService = chatService;
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    generateQRCode() {
        return crypto.randomBytes(16).toString('hex');
    }
    generateTicketCode() {
        return crypto
            .randomBytes(4)
            .toString('hex')
            .toUpperCase();
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
    async registerForEvent(userId, eventId, dto) {
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
            throw new common_1.NotFoundException('Event not found');
        }
        const requestedTicketTypeId = dto.ticketTypeId || null;
        const paidRegistration = event.registrations.find((r) => r.paymentStatus === client_1.PaymentStatus.PAID &&
            r.status !== client_1.RegistrationStatus.CANCELLED &&
            (r.ticketTypeId || null) === requestedTicketTypeId);
        if (paidRegistration) {
            throw new common_1.BadRequestException('You already have a ticket of this type for this event');
        }
        const pendingRegistration = event.registrations.find((r) => r.paymentStatus === client_1.PaymentStatus.PENDING &&
            (r.ticketTypeId || null) === requestedTicketTypeId);
        if (pendingRegistration) {
            await this.prisma.eventRegistration.delete({
                where: { id: pendingRegistration.id },
            });
        }
        if (event.status !== 'PUBLISHED') {
            throw new common_1.BadRequestException('Event is not open for registration');
        }
        const quantity = dto.quantity || 1;
        if (event.capacity && event.registeredCount + quantity > event.capacity) {
            if (event.waitlistEnabled) {
                return this.addToWaitlist(userId, eventId, dto);
            }
            throw new common_1.BadRequestException('Event is fully booked');
        }
        let ticketType = null;
        if (dto.ticketTypeId) {
            ticketType = event.ticketTypes.find((t) => t.id === dto.ticketTypeId);
            if (!ticketType) {
                throw new common_1.NotFoundException('Ticket type not found');
            }
            if (!ticketType.isActive || !ticketType.isVisible) {
                throw new common_1.BadRequestException('Ticket type not available');
            }
            const reserved = await this.cache.reserveTickets(eventId, dto.ticketTypeId, userId, quantity);
            if (!reserved) {
                if (ticketType.soldCount + quantity > ticketType.totalQuantity) {
                    throw new common_1.BadRequestException('Not enough tickets available');
                }
            }
            if (quantity > ticketType.perUserLimit) {
                throw new common_1.BadRequestException(`Maximum ${ticketType.perUserLimit} tickets per user`);
            }
        }
        const basePrice = ticketType
            ? Number(ticketType.price) * quantity
            : 0;
        const subscription = event.space.creator.subscription;
        const planLimits = plan_limits_config_1.PLAN_LIMITS[subscription.plan];
        const processingFeePercent = planLimits.processingFeePercent;
        const processingFee = (basePrice * processingFeePercent) / 100;
        const totalAmount = basePrice + processingFee;
        const coinsToUse = dto.coinsToUse || 0;
        let coinValueINR = 0;
        let razorpayAmount = totalAmount;
        if (coinsToUse > 0) {
            const wallet = await this.walletService.getWallet(userId);
            if (wallet.balance < coinsToUse) {
                throw new common_1.BadRequestException('Insufficient coin balance');
            }
            coinValueINR = (0, coin_constants_1.coinsToINR)(coinsToUse);
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
                totalAmount: new client_1.Prisma.Decimal(totalAmount),
                coinsUsed: coinsToUse,
                coinValueINR: new client_1.Prisma.Decimal(coinValueINR),
                razorpayAmount: new client_1.Prisma.Decimal(razorpayAmount),
                processingFee: new client_1.Prisma.Decimal(processingFee),
                paymentStatus: razorpayAmount > 0 ? client_1.PaymentStatus.PENDING : client_1.PaymentStatus.PAID,
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
        await this.prisma.$transaction(async (tx) => {
            await tx.eventRegistration.update({
                where: { id: registration.id },
                data: {
                    paymentStatus: client_1.PaymentStatus.PAID,
                    paidAt: new Date(),
                },
            });
            if (coinsToUse > 0) {
                await this.walletService.debitCoins(userId, coinsToUse, client_1.CoinSource.EVENT_REGISTRATION, `Registration for ${event.title}`, {
                    referenceId: registration.id,
                    referenceType: 'EventRegistration',
                });
            }
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
    async sendRegistrationConfirmations(registrationId) {
        const fullRegistration = await this.prisma.eventRegistration.findUnique({
            where: { id: registrationId },
            include: {
                user: true,
                event: true,
            },
        });
        if (!fullRegistration)
            return;
        try {
            if (fullRegistration.user?.mobileNumber) {
                const eventDate = this.formatEventDate(fullRegistration.event.startDateTime);
                const eventTime = this.formatEventTime(fullRegistration.event.startDateTime, fullRegistration.event.endDateTime);
                await this.whatsappService.sendRegistrationConfirmation(fullRegistration.user.mobileNumber, {
                    userName: fullRegistration.user.fullName || fullRegistration.user.username || 'there',
                    eventTitle: fullRegistration.event.title,
                    eventDate,
                    eventTime,
                    venueName: fullRegistration.event.venueName || undefined,
                    city: fullRegistration.event.city || undefined,
                    isOnline: fullRegistration.event.type === 'ONLINE',
                    onlineUrl: fullRegistration.event.onlineUrl || undefined,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to send WhatsApp notification', error);
        }
        const identity = await this.prisma.userIdentity.findFirst({
            where: { userId: fullRegistration.userId, email: { not: null }, isPrimary: true },
            select: { email: true },
        });
        if (identity?.email) {
            const eventDate = this.formatEventDate(fullRegistration.event.startDateTime);
            const eventTime = this.formatEventTime(fullRegistration.event.startDateTime, fullRegistration.event.endDateTime);
            this.emailService
                .sendRegistrationConfirmation({
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
            })
                .catch((err) => this.logger.error('Failed to send registration confirmation email', err));
        }
    }
    async completeRSVP(userId, eventId, dto, event) {
        const qrCode = this.generateQRCode();
        const registration = await this.prisma.$transaction(async (tx) => {
            const reg = await tx.eventRegistration.create({
                data: {
                    eventId,
                    userId,
                    ticketTypeId: dto.ticketTypeId,
                    quantity: dto.quantity || 1,
                    totalAmount: new client_1.Prisma.Decimal(0),
                    paymentStatus: client_1.PaymentStatus.PAID,
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
        const fullRegistration = await this.prisma.eventRegistration.findUnique({
            where: { id: registration.id },
            include: {
                user: true,
                event: true,
            },
        });
        try {
            if (fullRegistration?.user?.mobileNumber) {
                const eventDate = this.formatEventDate(fullRegistration.event.startDateTime);
                const eventTime = this.formatEventTime(fullRegistration.event.startDateTime, fullRegistration.event.endDateTime);
                await this.whatsappService.sendRegistrationConfirmation(fullRegistration.user.mobileNumber, {
                    userName: fullRegistration.user.fullName || fullRegistration.user.username || 'there',
                    eventTitle: fullRegistration.event.title,
                    eventDate,
                    eventTime,
                    venueName: fullRegistration.event.venueName || undefined,
                    city: fullRegistration.event.city || undefined,
                    isOnline: fullRegistration.event.type === 'ONLINE',
                    onlineUrl: fullRegistration.event.onlineUrl || undefined,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to send RSVP WhatsApp notification', error);
        }
        const identity = await this.prisma.userIdentity.findFirst({
            where: { userId, email: { not: null }, isPrimary: true },
            select: { email: true },
        });
        if (identity?.email && fullRegistration) {
            const eventDate = this.formatEventDate(fullRegistration.event.startDateTime);
            const eventTime = this.formatEventTime(fullRegistration.event.startDateTime, fullRegistration.event.endDateTime);
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
        try {
            await this.chatService.addParticipant(eventId, userId);
        }
        catch (err) {
            this.logger.error(`Failed to add chat participant (event ${eventId}, user ${userId}): ${err instanceof Error ? err.message : String(err)}`);
        }
        return {
            registrationId: registration.id,
            message: 'RSVP successful',
            qrCode: registration.qrCode,
        };
    }
    async addToWaitlist(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                space: true,
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const qrCode = this.generateQRCode();
        const registration = await this.prisma.eventRegistration.create({
            data: {
                eventId,
                userId,
                ticketTypeId: dto.ticketTypeId,
                quantity: dto.quantity || 1,
                totalAmount: new client_1.Prisma.Decimal(0),
                paymentStatus: client_1.PaymentStatus.PENDING,
                isWaitlisted: true,
                qrCode,
                formResponses: dto.formResponses || {},
            },
        });
        await this.prisma.event.update({
            where: { id: eventId },
            data: { waitlistCount: { increment: 1 } },
        });
        const identity = await this.prisma.userIdentity.findFirst({
            where: { userId, email: { not: null }, isPrimary: true },
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
    async createRazorpayOrder(userId, registrationId) {
        const registration = await this.prisma.eventRegistration.findUnique({
            where: { id: registrationId },
            include: { event: true },
        });
        if (!registration) {
            throw new common_1.NotFoundException('Registration not found');
        }
        if (registration.userId !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (registration.paymentStatus !== client_1.PaymentStatus.PENDING) {
            throw new common_1.BadRequestException('Payment already processed');
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
    async getMyRegistration(userId, eventId) {
        const registrations = await this.getMyRegistrationsForEvent(userId, eventId);
        return registrations[0] || null;
    }
    async getMyRegistrationsForEvent(userId, eventId) {
        const registrations = await this.prisma.eventRegistration.findMany({
            where: {
                eventId,
                userId,
                paymentStatus: client_1.PaymentStatus.PAID,
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
            orderBy: { registeredAt: 'desc' },
        });
        return registrations;
    }
    async getEventRegistrations(userId, eventId, page = 1, limit = 50) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
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
            throw new common_1.BadRequestException('Unauthorized');
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
    async exportRegistrations(userId, eventId) {
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
            throw new common_1.NotFoundException('Event not found');
        }
        const subscription = event.space.creator.subscription;
        if (!subscription) {
            throw new common_1.BadRequestException('Organiser has no subscription');
        }
        const planLimits = plan_limits_config_1.PLAN_LIMITS[subscription.plan];
        if (!planLimits.hasBulkExport) {
            throw new common_1.BadRequestException('Bulk export not available in your plan');
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
            throw new common_1.BadRequestException('Unauthorized');
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
    async getMyRegistrations(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [registrations, total] = await Promise.all([
            this.prisma.eventRegistration.findMany({
                where: { userId, paymentStatus: client_1.PaymentStatus.PAID },
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
                    tickets: true,
                },
            }),
            this.prisma.eventRegistration.count({ where: { userId, paymentStatus: client_1.PaymentStatus.PAID } }),
        ]);
        return {
            data: registrations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async createPaymentOrder(eventId, userId, dto) {
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
            throw new common_1.NotFoundException('Event not found');
        }
        if (event.status !== 'PUBLISHED') {
            throw new common_1.BadRequestException('Event is not open for registration');
        }
        const paidOrderReg = event.registrations.find((r) => r.paymentStatus === client_1.PaymentStatus.PAID &&
            r.status !== client_1.RegistrationStatus.CANCELLED &&
            r.ticketTypeId === dto.ticketTypeId);
        if (paidOrderReg) {
            throw new common_1.BadRequestException('You already have a ticket of this type for this event');
        }
        const pendingOrderReg = event.registrations.find((r) => r.paymentStatus === client_1.PaymentStatus.PENDING &&
            r.ticketTypeId === dto.ticketTypeId);
        if (pendingOrderReg) {
            await this.prisma.eventRegistration.delete({
                where: { id: pendingOrderReg.id },
            });
        }
        const ticketType = event.ticketTypes.find((t) => t.id === dto.ticketTypeId);
        if (!ticketType) {
            throw new common_1.NotFoundException('Ticket type not found');
        }
        if (!ticketType.isActive || !ticketType.isVisible) {
            throw new common_1.BadRequestException('Ticket type not available');
        }
        if (ticketType.soldCount + dto.quantity > ticketType.totalQuantity) {
            throw new common_1.BadRequestException('Not enough tickets available');
        }
        if (dto.quantity > ticketType.perUserLimit) {
            throw new common_1.BadRequestException(`Maximum ${ticketType.perUserLimit} tickets per user`);
        }
        const baseAmount = Number(ticketType.price) * dto.quantity;
        const subscription = event.space.creator.subscription;
        const planLimits = plan_limits_config_1.PLAN_LIMITS[subscription.plan];
        const feePercent = planLimits.processingFeePercent;
        const processingFee = (baseAmount * feePercent) / 100;
        const totalAmount = baseAmount + processingFee;
        const coinsToUse = dto.coinsToUse || 0;
        let coinValueINR = 0;
        let razorpayAmount = totalAmount;
        if (coinsToUse > 0) {
            const wallet = await this.walletService.getWallet(userId);
            if (wallet.balance < coinsToUse) {
                throw new common_1.BadRequestException('Insufficient coin balance');
            }
            const requestedCoinValueINR = (0, coin_constants_1.coinsToINR)(coinsToUse);
            coinValueINR = Math.min(requestedCoinValueINR, baseAmount);
            razorpayAmount = Math.max(0, totalAmount - coinValueINR);
        }
        if (razorpayAmount === 0) {
            const qrCode = this.generateQRCode();
            const registration = await this.prisma.$transaction(async (tx) => {
                const reg = await tx.eventRegistration.create({
                    data: {
                        eventId,
                        userId,
                        ticketTypeId: dto.ticketTypeId,
                        quantity: dto.quantity,
                        totalAmount: new client_1.Prisma.Decimal(totalAmount),
                        coinsUsed: coinsToUse,
                        coinValueINR: new client_1.Prisma.Decimal(coinValueINR),
                        razorpayAmount: new client_1.Prisma.Decimal(0),
                        processingFee: new client_1.Prisma.Decimal(processingFee),
                        paymentStatus: client_1.PaymentStatus.PAID,
                        status: client_1.RegistrationStatus.REGISTERED,
                        paidAt: new Date(),
                        qrCode,
                        formResponses: dto.formResponses || {},
                    },
                });
                if (coinsToUse > 0) {
                    await this.walletService.debitCoins(userId, coinsToUse, client_1.CoinSource.EVENT_REGISTRATION, `Registration for ${event.title}`, { referenceId: reg.id, referenceType: 'EventRegistration' });
                }
                await tx.event.update({
                    where: { id: eventId },
                    data: { registeredCount: { increment: dto.quantity } },
                });
                await tx.eventTicketType.update({
                    where: { id: dto.ticketTypeId },
                    data: { soldCount: { increment: dto.quantity } },
                });
                for (let i = 0; i < dto.quantity; i++) {
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
            const fullRegistration = await this.prisma.eventRegistration.findUnique({
                where: { id: registration.id },
                include: { user: true, event: true },
            });
            try {
                if (fullRegistration?.user?.mobileNumber) {
                    const evDate = this.formatEventDate(fullRegistration.event.startDateTime);
                    const evTime = this.formatEventTime(fullRegistration.event.startDateTime, fullRegistration.event.endDateTime);
                    await this.whatsappService.sendRegistrationConfirmation(fullRegistration.user.mobileNumber, {
                        userName: fullRegistration.user.fullName || fullRegistration.user.username || 'there',
                        eventTitle: fullRegistration.event.title,
                        eventDate: evDate,
                        eventTime: evTime,
                        venueName: fullRegistration.event.venueName || undefined,
                        city: fullRegistration.event.city || undefined,
                        isOnline: fullRegistration.event.type === 'ONLINE',
                        onlineUrl: fullRegistration.event.onlineUrl || undefined,
                    });
                }
            }
            catch (error) {
                this.logger.error('Failed to send free-ticket WhatsApp notification', error);
            }
            const identity = await this.prisma.userIdentity.findFirst({
                where: { userId, email: { not: null }, isPrimary: true },
                select: { email: true },
            });
            if (identity?.email && fullRegistration) {
                const evDate = this.formatEventDate(fullRegistration.event.startDateTime);
                const evTime = this.formatEventTime(fullRegistration.event.startDateTime, fullRegistration.event.endDateTime);
                this.emailService.sendRegistrationConfirmation({
                    email: identity.email,
                    userName: fullRegistration.user.fullName || fullRegistration.user.username || 'there',
                    eventTitle: fullRegistration.event.title,
                    eventDate: evDate,
                    eventTime: evTime,
                    venueName: fullRegistration.event.venueName || undefined,
                    city: fullRegistration.event.city || undefined,
                    isOnline: fullRegistration.event.type === 'ONLINE',
                    onlineUrl: fullRegistration.event.onlineUrl || undefined,
                    qrCode: fullRegistration.qrCode,
                    ticketCode: undefined,
                }).catch((err) => this.logger.error('Failed to send free-ticket confirmation email', err));
            }
            return {
                registrationId: registration.id,
                razorpayOrderId: null,
                razorpayKeyId: null,
                amount: 0,
                currency: 'INR',
                breakdown: {
                    baseAmount,
                    processingFee,
                    coinsUsed: coinsToUse,
                    coinValueINR,
                    razorpayAmount: 0,
                    totalAmount,
                },
            };
        }
        const qrCode = this.generateQRCode();
        const registration = await this.prisma.eventRegistration.create({
            data: {
                eventId,
                userId,
                ticketTypeId: dto.ticketTypeId,
                quantity: dto.quantity,
                totalAmount: new client_1.Prisma.Decimal(totalAmount),
                coinsUsed: coinsToUse,
                coinValueINR: new client_1.Prisma.Decimal(coinValueINR),
                razorpayAmount: new client_1.Prisma.Decimal(razorpayAmount),
                processingFee: new client_1.Prisma.Decimal(processingFee),
                paymentStatus: client_1.PaymentStatus.PENDING,
                status: client_1.RegistrationStatus.REGISTERED,
                qrCode,
                formResponses: dto.formResponses || {},
            },
        });
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
        await this.prisma.eventRegistration.update({
            where: { id: registration.id },
            data: { orderId: order.id },
        });
        const client = this.cache['redis'].getClient();
        if (client) {
            await client.set(`order:${order.id}`, registration.id, 'EX', 1800);
        }
        this.logger.log(`Created Razorpay order ${order.id} for registration ${registration.id}`);
        return {
            registrationId: registration.id,
            razorpayOrderId: order.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: Math.round(razorpayAmount * 100),
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
    async verifyPayment(eventId, userId, dto) {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
            .digest('hex');
        if (expectedSignature !== dto.razorpaySignature) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
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
            throw new common_1.NotFoundException('Registration not found');
        }
        if (registration.userId !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (registration.paymentStatus === client_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Payment already completed');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.eventRegistration.update({
                where: { id: registration.id },
                data: {
                    paymentStatus: client_1.PaymentStatus.PAID,
                    paymentId: dto.razorpayPaymentId,
                    orderId: dto.razorpayOrderId,
                    paidAt: new Date(),
                },
            });
            if (registration.coinsUsed > 0) {
                await this.walletService.debitCoins(userId, registration.coinsUsed, client_1.CoinSource.EVENT_REGISTRATION, `Registration for ${registration.event.title}`, {
                    referenceId: registration.id,
                    referenceType: 'EventRegistration',
                });
            }
            if (registration.ticketTypeId) {
                await tx.eventTicketType.update({
                    where: { id: registration.ticketTypeId },
                    data: { soldCount: { increment: registration.quantity } },
                });
            }
            await tx.event.update({
                where: { id: eventId },
                data: { registeredCount: { increment: registration.quantity } },
            });
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
        const client = this.cache['redis'].getClient();
        if (client) {
            await client.del(`order:${dto.razorpayOrderId}`);
        }
        try {
            if (registration.user.mobileNumber) {
                await this.whatsappService.sendPaymentConfirmation(registration.user.mobileNumber, {
                    userName: registration.user.fullName || registration.user.username || 'there',
                    eventTitle: registration.event.title,
                    amount: Number(registration.razorpayAmount),
                    coinsUsed: registration.coinsUsed > 0 ? registration.coinsUsed : undefined,
                    ticketCode: updatedRegistration.tickets[0]?.ticketCode || registration.qrCode,
                });
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
                await this.whatsappService.sendRegistrationConfirmation(registration.user.mobileNumber, {
                    userName: registration.user.fullName || registration.user.username || 'there',
                    eventTitle: registration.event.title,
                    eventDate,
                    eventTime: `${startTime} - ${endTime} IST`,
                    venueName: registration.event.venueName || undefined,
                    city: registration.event.city || undefined,
                    isOnline: registration.event.type === 'ONLINE',
                    onlineUrl: registration.event.onlineUrl || undefined,
                });
            }
            const userEmail = updatedRegistration?.user?.identities?.[0]?.email;
            if (userEmail) {
                const eventDate = this.formatEventDate(registration.event.startDateTime);
                const eventTime = this.formatEventTime(registration.event.startDateTime, registration.event.endDateTime);
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
                    ticketCode: updatedRegistration.tickets[0]?.ticketCode || undefined,
                    qrCode: registration.qrCode,
                }).catch(err => this.logger.error('Failed to send payment confirmation email', err));
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
                    ticketCode: updatedRegistration.tickets[0]?.ticketCode || undefined,
                }).catch(err => this.logger.error('Failed to send registration confirmation email', err));
            }
        }
        catch (error) {
            this.logger.error('Failed to send notification after payment', error);
        }
        await this.cache.invalidateCheckinCache(eventId);
        await this.cache.incrementEventScore(eventId);
        this.logger.log(`Payment verified for registration ${registration.id}`);
        try {
            await this.chatService.addParticipant(eventId, userId);
        }
        catch (err) {
            this.logger.error(`Failed to add chat participant (event ${eventId}, user ${userId}): ${err instanceof Error ? err.message : String(err)}`);
        }
        return {
            registrationId: registration.id,
            message: 'Payment verified, registration complete',
            qrCode: registration.qrCode,
            tickets: updatedRegistration.tickets,
        };
    }
    async handleRazorpayWebhook(payload, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');
        if (signature !== expectedSignature) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const event = payload.event;
        const paymentData = payload.payload.payment.entity;
        if (event === 'payment.captured') {
            const orderId = paymentData.order_id;
            const paymentId = paymentData.id;
            const client = this.cache['redis'].getClient();
            const registrationId = client ? await client.get(`order:${orderId}`) : null;
            if (!registrationId) {
                this.logger.warn(`No registration found in cache for order ${orderId}`);
                const registration = await this.prisma.eventRegistration.findFirst({
                    where: { orderId },
                });
                if (!registration) {
                    this.logger.error(`No registration found for order ${orderId}`);
                    return { received: true };
                }
                if (registration.paymentStatus === client_1.PaymentStatus.PAID) {
                    this.logger.log(`Registration ${registration.id} already paid`);
                    return { received: true };
                }
                await this.completeWebhookPayment(registration.id, paymentId, orderId);
            }
            else {
                const registration = await this.prisma.eventRegistration.findUnique({
                    where: { id: registrationId },
                });
                if (registration && registration.paymentStatus === client_1.PaymentStatus.PENDING) {
                    await this.completeWebhookPayment(registrationId, paymentId, orderId);
                }
                else {
                    this.logger.log(`Registration ${registrationId} already processed`);
                }
            }
        }
        else if (event === 'payment.failed') {
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
            if (registration && registration.paymentStatus === client_1.PaymentStatus.PENDING) {
                await this.prisma.eventRegistration.update({
                    where: { id: registration.id },
                    data: { paymentStatus: client_1.PaymentStatus.FAILED },
                });
                this.logger.log(`Payment failed for registration ${registration.id}`);
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
    async completeWebhookPayment(registrationId, paymentId, orderId) {
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
            await tx.eventRegistration.update({
                where: { id: registrationId },
                data: {
                    paymentStatus: client_1.PaymentStatus.PAID,
                    paymentId,
                    paidAt: new Date(),
                },
            });
            if (registration.coinsUsed > 0) {
                await this.walletService.debitCoins(registration.userId, registration.coinsUsed, client_1.CoinSource.EVENT_REGISTRATION, `Registration for ${registration.event.title}`, {
                    referenceId: registration.id,
                    referenceType: 'EventRegistration',
                });
            }
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
                await this.whatsappService.sendRegistrationConfirmation(registration.user.mobileNumber, {
                    userName: registration.user.fullName || registration.user.username || 'there',
                    eventTitle: registration.event.title,
                    eventDate,
                    eventTime: `${startTime} - ${endTime} IST`,
                    venueName: registration.event.venueName || undefined,
                    city: registration.event.city || undefined,
                    isOnline: registration.event.type === 'ONLINE',
                    onlineUrl: registration.event.onlineUrl || undefined,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to send notification from webhook', error);
        }
        const client = this.cache['redis'].getClient();
        if (client) {
            await client.del(`order:${orderId}`);
        }
        await this.cache.invalidateCheckinCache(registration.eventId);
        this.logger.log(`Webhook processed payment for registration ${registrationId}`);
    }
    async cancelRegistration(eventId, userId, ticketTypeId) {
        const registration = await this.prisma.eventRegistration.findFirst({
            where: {
                eventId,
                userId,
                ...(ticketTypeId !== undefined ? { ticketTypeId: ticketTypeId || null } : {}),
            },
            include: {
                event: true,
                user: true,
            },
        });
        if (!registration) {
            throw new common_1.NotFoundException('Registration not found');
        }
        if (registration.status === client_1.RegistrationStatus.CANCELLED) {
            throw new common_1.BadRequestException('Registration already cancelled');
        }
        if (registration.event.startDateTime < new Date()) {
            throw new common_1.BadRequestException('Cannot cancel past event registration');
        }
        let razorpayRefundInitiated = false;
        await this.prisma.$transaction(async (tx) => {
            await tx.eventRegistration.update({
                where: { id: registration.id },
                data: {
                    status: client_1.RegistrationStatus.CANCELLED,
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
                data: { status: client_1.TicketStatus.CANCELLED },
            });
            if (registration.coinsUsed > 0) {
                await this.walletService.creditCoins(userId, registration.coinsUsed, client_1.CoinSource.REFUND, `Refund for cancelled registration: ${registration.event.title}`, {
                    referenceId: registration.id,
                    referenceType: 'EventRegistration',
                });
            }
        });
        if (Number(registration.razorpayAmount) > 0 &&
            registration.paymentId &&
            registration.paymentStatus === client_1.PaymentStatus.PAID) {
            try {
                await this.razorpay.payments.refund(registration.paymentId, {
                    amount: Math.round(Number(registration.razorpayAmount) * 100),
                });
                razorpayRefundInitiated = true;
                this.logger.log(`Razorpay refund initiated for registration ${registration.id}`);
            }
            catch (error) {
                this.logger.error(`Razorpay refund failed: ${error.message}`);
            }
        }
        try {
            if (registration.user.mobileNumber) {
                await this.whatsappService.sendCancellationNotification(registration.user.mobileNumber, {
                    userName: registration.user.fullName || registration.user.username || 'there',
                    eventTitle: registration.event.title,
                    coinsRefunded: registration.coinsUsed > 0 ? registration.coinsUsed : undefined,
                    razorpayRefundInitiated,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to send cancellation notification', error);
        }
        const identity = await this.prisma.userIdentity.findFirst({
            where: { userId, email: { not: null }, isPrimary: true },
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
        await this.cache.invalidateCheckinCache(eventId);
        this.logger.log(`Cancelled registration ${registration.id}`);
        try {
            await this.chatService.removeParticipant(eventId, userId);
        }
        catch (err) {
            this.logger.error(`Failed to remove chat participant (event ${eventId}, user ${userId}): ${err instanceof Error ? err.message : String(err)}`);
        }
        return {
            message: 'Registration cancelled successfully',
            coinsRefunded: registration.coinsUsed,
            razorpayRefundInitiated,
        };
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = RegistrationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        email_service_1.EmailService,
        whatsapp_service_1.WhatsAppService,
        cache_service_1.CacheService,
        chat_service_1.ChatService])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map