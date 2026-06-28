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
var SubscriptionSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const cache_service_1 = require("../cache/cache.service");
const client_1 = require("@prisma/client");
let SubscriptionSchedulerService = SubscriptionSchedulerService_1 = class SubscriptionSchedulerService {
    prisma;
    emailService;
    cache;
    logger = new common_1.Logger(SubscriptionSchedulerService_1.name);
    constructor(prisma, emailService, cache) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.cache = cache;
    }
    async handleExpiredSubscriptions() {
        this.logger.log('Starting expired subscriptions job...');
        const now = new Date();
        const expired = await this.prisma.orgSubscription.findMany({
            where: {
                expiresAt: { lte: now },
                isActive: true,
                plan: { not: client_1.OrgPlan.STARTER },
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
        for (const sub of expired) {
            const oldPlan = sub.plan;
            await this.prisma.orgSubscription.update({
                where: { id: sub.id },
                data: {
                    plan: client_1.OrgPlan.STARTER,
                    isActive: false,
                    cancelledAt: now,
                },
            });
            await this.cache.invalidatePlanCache(sub.userId);
            const email = sub.user.identities[0]?.email;
            if (email) {
                this.emailService
                    .sendSubscriptionExpired({
                    email,
                    userName: sub.user.fullName || sub.user.username || 'there',
                    plan: oldPlan,
                    downgradedTo: 'STARTER',
                })
                    .catch((err) => this.logger.error('Subscription expired email failed', err));
                this.emailService
                    .sendSubscriptionDowngraded({
                    email,
                    userName: sub.user.fullName || sub.user.username || 'there',
                    fromPlan: oldPlan,
                    toPlan: 'STARTER',
                })
                    .catch((err) => this.logger.error('Subscription downgraded email failed', err));
            }
            this.logger.log(`Downgraded subscription ${sub.id} from ${oldPlan} to STARTER`);
        }
        this.logger.log(`Expired subscriptions job completed. Downgraded ${expired.length} subscriptions`);
    }
    async sendExpiringSubscriptionWarnings() {
        this.logger.log('Starting expiring subscription warnings job...');
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const in6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
        const expiring = await this.prisma.orgSubscription.findMany({
            where: {
                expiresAt: { gte: in6Days, lte: in7Days },
                isActive: true,
                plan: { not: client_1.OrgPlan.STARTER },
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
        for (const sub of expiring) {
            const email = sub.user.identities[0]?.email;
            if (email && sub.expiresAt) {
                this.emailService
                    .sendSubscriptionExpiring({
                    email,
                    userName: sub.user.fullName || sub.user.username || 'there',
                    plan: sub.plan,
                    expiresAt: this.formatDate(sub.expiresAt),
                    renewUrl: 'https://forge.unifesto.app/subscription',
                })
                    .catch((err) => this.logger.error('Subscription expiring email failed', err));
            }
        }
        this.logger.log(`Expiring subscription warnings job completed. Sent ${expiring.length} warnings`);
    }
    async resetMonthlyEventCounts() {
        this.logger.log('Starting monthly event count reset job...');
        const result = await this.prisma.orgSubscription.updateMany({
            data: {
                eventsThisMonth: 0,
                usageResetAt: new Date(),
            },
        });
        this.logger.log(`Monthly event count reset completed. Reset ${result.count} subscriptions`);
    }
    formatDate(date) {
        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    }
};
exports.SubscriptionSchedulerService = SubscriptionSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionSchedulerService.prototype, "handleExpiredSubscriptions", null);
__decorate([
    (0, schedule_1.Cron)('0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionSchedulerService.prototype, "sendExpiringSubscriptionWarnings", null);
__decorate([
    (0, schedule_1.Cron)('0 0 1 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionSchedulerService.prototype, "resetMonthlyEventCounts", null);
exports.SubscriptionSchedulerService = SubscriptionSchedulerService = SubscriptionSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        cache_service_1.CacheService])
], SubscriptionSchedulerService);
//# sourceMappingURL=subscription-scheduler.service.js.map