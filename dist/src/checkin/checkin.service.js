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
var CheckinService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const email_service_1 = require("../email/email.service");
const cache_service_1 = require("../cache/cache.service");
const client_1 = require("@prisma/client");
const coin_constants_1 = require("../wallet/coin.constants");
let CheckinService = CheckinService_1 = class CheckinService {
    prisma;
    walletService;
    emailService;
    cache;
    logger = new common_1.Logger(CheckinService_1.name);
    constructor(prisma, walletService, emailService, cache) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.emailService = emailService;
        this.cache = cache;
    }
    async canManageCheckin(userId, spaceId) {
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
    async scanQRCode(userId, qrCode) {
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
                throw new common_1.NotFoundException('Invalid QR code');
            }
            return this.checkInTicket(userId, ticket);
        }
        return this.checkInRegistration(userId, registration);
    }
    async checkInRegistration(userId, registration) {
        const canManage = await this.canManageCheckin(userId, registration.event.spaceId);
        if (!canManage) {
            throw new common_1.BadRequestException('You are not authorized to check in attendees for this event');
        }
        if (registration.status === client_1.RegistrationStatus.CANCELLED) {
            throw new common_1.BadRequestException('Registration has been cancelled');
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
                    status: client_1.RegistrationStatus.ATTENDED,
                },
            });
            await tx.eventTicket.updateMany({
                where: { registrationId: registration.id },
                data: {
                    status: client_1.TicketStatus.USED,
                    checkedInAt: new Date(),
                },
            });
        });
        try {
            await this.walletService.creditCoins(registration.userId, coin_constants_1.COIN_CONSTANTS.ATTEND_EVENT_REWARD, client_1.CoinSource.EVENT_ATTENDANCE, `Attended: ${registration.event.title}`, {
                referenceId: registration.id,
                referenceType: 'EventRegistration',
            });
        }
        catch (error) {
            this.logger.error(`Failed to award coins: ${error.message}`);
        }
        const identity = await this.prisma.userIdentity.findFirst({
            where: { userId: registration.userId, email: { not: null }, isPrimary: true },
            select: { email: true },
        });
        if (identity?.email) {
            const checkedInAt = new Date().toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
            this.emailService.sendCheckinConfirmation({
                email: identity.email,
                userName: registration.user.fullName || registration.user.username || 'there',
                eventTitle: registration.event.title,
                checkedInAt,
                coinsAwarded: coin_constants_1.COIN_CONSTANTS.ATTEND_EVENT_REWARD,
            }).catch(err => this.logger.error('Failed to send checkin confirmation email', err));
        }
        this.logger.log(`Checked in user ${registration.userId} for event ${registration.event.id}`);
        return {
            success: true,
            checkedInAt: new Date(),
            attendee: registration.user,
            ticketType: registration.ticketType?.name || 'RSVP',
            coinsAwarded: coin_constants_1.COIN_CONSTANTS.ATTEND_EVENT_REWARD,
        };
    }
    async checkInTicket(userId, ticket) {
        const registration = ticket.registration;
        const canManage = await this.canManageCheckin(userId, registration.event.spaceId);
        if (!canManage) {
            throw new common_1.BadRequestException('You are not authorized to check in attendees for this event');
        }
        if (registration.status === client_1.RegistrationStatus.CANCELLED) {
            throw new common_1.BadRequestException('Registration has been cancelled');
        }
        if (ticket.status === client_1.TicketStatus.USED) {
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
                    status: client_1.TicketStatus.USED,
                    checkedInAt: new Date(),
                },
            });
            const allTickets = await tx.eventTicket.findMany({
                where: { registrationId: registration.id },
            });
            const allUsed = allTickets.every((t) => t.status === client_1.TicketStatus.USED);
            if (allUsed) {
                await tx.eventRegistration.update({
                    where: { id: registration.id },
                    data: {
                        checkedInAt: new Date(),
                        checkedInBy: userId,
                        status: client_1.RegistrationStatus.ATTENDED,
                    },
                });
            }
        });
        try {
            const existingReward = await this.prisma.walletTransaction.findFirst({
                where: {
                    wallet: { userId: registration.userId },
                    source: client_1.CoinSource.EVENT_ATTENDANCE,
                    referenceId: registration.id,
                },
            });
            if (!existingReward) {
                await this.walletService.creditCoins(registration.userId, coin_constants_1.COIN_CONSTANTS.ATTEND_EVENT_REWARD, client_1.CoinSource.EVENT_ATTENDANCE, `Attended: ${registration.event.title}`, {
                    referenceId: registration.id,
                    referenceType: 'EventRegistration',
                });
            }
        }
        catch (error) {
            this.logger.error(`Failed to award coins: ${error.message}`);
        }
        this.logger.log(`Checked in ticket ${ticket.id} for user ${registration.userId}`);
        return {
            success: true,
            checkedInAt: new Date(),
            attendee: registration.user,
            ticketType: registration.ticketType?.name || 'RSVP',
            coinsAwarded: coin_constants_1.COIN_CONSTANTS.ATTEND_EVENT_REWARD,
        };
    }
    async getEventRegistrationsForOffline(userId, eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageCheckin(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        const cachedData = await this.cache.getEventRegistrationsForCheckin(eventId);
        if (cachedData) {
            return {
                eventId,
                eventTitle: event.title,
                registrations: cachedData,
                totalCount: cachedData.length,
                checkedInCount: cachedData.filter((r) => r.checkedInAt).length,
                fromCache: true,
            };
        }
        const registrations = await this.prisma.eventRegistration.findMany({
            where: {
                eventId,
                status: {
                    in: [client_1.RegistrationStatus.REGISTERED, client_1.RegistrationStatus.ATTENDED],
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
    async getCheckinStats(userId, eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageCheckin(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        const [total, checkedIn, cancelled] = await Promise.all([
            this.prisma.eventRegistration.count({
                where: {
                    eventId,
                    status: {
                        in: [client_1.RegistrationStatus.REGISTERED, client_1.RegistrationStatus.ATTENDED],
                    },
                },
            }),
            this.prisma.eventRegistration.count({
                where: {
                    eventId,
                    status: client_1.RegistrationStatus.ATTENDED,
                },
            }),
            this.prisma.eventRegistration.count({
                where: {
                    eventId,
                    status: client_1.RegistrationStatus.CANCELLED,
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
    async bulkCheckin(userId, eventId, registrationIds) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const canManage = await this.canManageCheckin(userId, event.spaceId);
        if (!canManage) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        const results = {
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
                            status: client_1.RegistrationStatus.ATTENDED,
                        },
                    });
                    await tx.eventTicket.updateMany({
                        where: { registrationId: regId },
                        data: {
                            status: client_1.TicketStatus.USED,
                            checkedInAt: new Date(),
                        },
                    });
                });
                try {
                    await this.walletService.creditCoins(registration.userId, coin_constants_1.COIN_CONSTANTS.ATTEND_EVENT_REWARD, client_1.CoinSource.EVENT_ATTENDANCE, `Attended: ${event.title}`, {
                        referenceId: regId,
                        referenceType: 'EventRegistration',
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to award coins: ${error.message}`);
                }
                results.success.push({
                    id: regId,
                    name: registration.user.fullName,
                });
            }
            catch (error) {
                results.failed.push({ id: regId, reason: error.message });
            }
        }
        this.logger.log(`Bulk check-in for event ${eventId}: ${results.success.length} success, ${results.failed.length} failed`);
        return results;
    }
};
exports.CheckinService = CheckinService;
exports.CheckinService = CheckinService = CheckinService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        email_service_1.EmailService,
        cache_service_1.CacheService])
], CheckinService);
//# sourceMappingURL=checkin.service.js.map