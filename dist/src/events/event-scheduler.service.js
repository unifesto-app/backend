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
var EventSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let EventSchedulerService = EventSchedulerService_1 = class EventSchedulerService {
    prisma;
    emailService;
    whatsappService;
    logger = new common_1.Logger(EventSchedulerService_1.name);
    constructor(prisma, emailService, whatsappService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.whatsappService = whatsappService;
    }
    async sendEventReminders() {
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
                        .catch((err) => this.logger.error('Event reminder email failed', err));
                }
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
                        .catch((err) => this.logger.error('Event reminder WhatsApp failed', err));
                }
            }
            this.logger.log(`Sent reminders for event ${event.id} to ${registrations.length} attendees`);
        }
        this.logger.log(`Event reminder job completed. Processed ${events.length} events`);
    }
    async sendEventStartingSoonNotifications() {
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
                        .catch((err) => this.logger.error('Event starting soon email failed', err));
                }
            }
            this.logger.log(`Sent starting soon notifications for event ${event.id} to ${registrations.length} attendees`);
        }
        this.logger.log(`Event starting soon job completed. Processed ${events.length} events`);
    }
    async markCompletedEvents() {
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
        }
        else {
            this.logger.log('No events to mark as completed');
        }
    }
    async sendEventSummaries() {
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
                        coinsAwarded: 50,
                    })
                        .catch((err) => this.logger.error('Event summary email failed', err));
                }
            }
            this.logger.log(`Sent event summaries for ${event.id} to ${attendees.length} attendees`);
        }
        this.logger.log(`Event summary job completed. Processed ${completedEvents.length} events`);
    }
    formatDate(dateTime, timezone = 'Asia/Kolkata') {
        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: timezone,
        }).format(dateTime);
    }
    formatTime(startTime, endTime, timezone = 'Asia/Kolkata') {
        const fmt = (d) => new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone,
        }).format(d);
        return `${fmt(startTime)} - ${fmt(endTime)} IST`;
    }
};
exports.EventSchedulerService = EventSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventSchedulerService.prototype, "sendEventReminders", null);
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventSchedulerService.prototype, "sendEventStartingSoonNotifications", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventSchedulerService.prototype, "markCompletedEvents", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventSchedulerService.prototype, "sendEventSummaries", null);
exports.EventSchedulerService = EventSchedulerService = EventSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        whatsapp_service_1.WhatsAppService])
], EventSchedulerService);
//# sourceMappingURL=event-scheduler.service.js.map