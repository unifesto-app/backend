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
var SubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
const plan_limits_config_1 = require("./plan-limits.config");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    prisma;
    cache;
    emailService;
    logger = new common_1.Logger(SubscriptionService_1.name);
    razorpay;
    constructor(prisma, cache, emailService) {
        this.prisma = prisma;
        this.cache = cache;
        this.emailService = emailService;
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    async createStarterSubscription(userId) {
        return this.prisma.orgSubscription.create({
            data: {
                userId,
                plan: client_1.OrgPlan.STARTER,
                billingCycle: client_1.BillingCycle.MONTHLY,
                isActive: true,
                usageResetAt: this.getNextMonthStart(),
            },
        });
    }
    async getMySubscription(userId) {
        const subscription = await this.prisma.orgSubscription.findUnique({
            where: { userId },
            include: {
                history: {
                    orderBy: { changedAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        await this.cache.setUserPlan(userId, subscription.plan);
        return subscription;
    }
    async getMyUsage(userId) {
        const subscription = await this.getMySubscription(userId);
        const spacesCount = await this.prisma.space.count({
            where: {
                createdBy: userId,
                status: { in: ['APPROVED', 'ACTIVE'] },
            },
        });
        const limits = plan_limits_config_1.PLAN_LIMITS[subscription.plan];
        return {
            spacesCount,
            eventsThisMonth: subscription.eventsThisMonth,
            plan: subscription.plan,
            limits: {
                spaces: limits.spaces,
                eventsPerMonth: limits.eventsPerMonth,
                attendeesPerEvent: limits.attendeesPerEvent,
                ticketTypes: limits.ticketTypes,
                coOrganisers: limits.coOrganisers,
            },
        };
    }
    async getAllPlans() {
        return Object.entries(plan_limits_config_1.PLAN_LIMITS).map(([plan, limits]) => ({
            plan,
            ...limits,
        }));
    }
    async createUpgradeOrder(userId, dto) {
        const subscription = await this.getMySubscription(userId);
        if (subscription.plan === dto.plan &&
            subscription.billingCycle === dto.billingCycle) {
            throw new common_1.BadRequestException('Already on this plan');
        }
        const planLimits = plan_limits_config_1.PLAN_LIMITS[dto.plan];
        const amount = dto.billingCycle === client_1.BillingCycle.MONTHLY
            ? planLimits.monthlyPrice
            : planLimits.annualPrice;
        if (amount === null || amount === 0) {
            throw new common_1.BadRequestException('Cannot upgrade to this plan via payment');
        }
        const order = await this.razorpay.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: `sub_${userId}_${Date.now()}`,
            notes: {
                userId,
                plan: dto.plan,
                billingCycle: dto.billingCycle,
            },
        });
        this.logger.log(`Created Razorpay order ${order.id} for user ${userId}`);
        return {
            orderId: order.id,
            amount,
            currency: 'INR',
            plan: dto.plan,
            billingCycle: dto.billingCycle,
        };
    }
    async verifyAndActivate(userId, dto) {
        const subscription = await this.getMySubscription(userId);
        const signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${dto.orderId}|${dto.paymentId}`)
            .digest('hex');
        if (signature !== dto.signature) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        const order = await this.razorpay.orders.fetch(dto.orderId);
        const plan = order.notes?.plan;
        const billingCycle = order.notes?.billingCycle;
        const planLimits = plan_limits_config_1.PLAN_LIMITS[plan];
        const expiresAt = billingCycle === client_1.BillingCycle.MONTHLY
            ? this.getNextMonthStart()
            : this.getNextYearStart();
        const oldPlan = subscription.plan;
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.subscriptionHistory.create({
                data: {
                    subscriptionId: subscription.id,
                    fromPlan: subscription.plan,
                    toPlan: plan,
                    reason: 'Paid upgrade',
                },
            });
            return tx.orgSubscription.update({
                where: { id: subscription.id },
                data: {
                    plan,
                    billingCycle,
                    amount: new client_1.Prisma.Decimal(Number(order.amount) / 100),
                    isActive: true,
                    expiresAt,
                    lastPaymentAt: new Date(),
                    nextPaymentAt: expiresAt,
                },
            });
        });
        await this.cache.invalidatePlanCache(userId);
        this.logger.log(`Activated ${plan} plan for user ${userId}`);
        const planFeatures = {
            GROWTH: ['Up to 10 events/month', '200 attendees per event', 'Waitlist management', 'Bulk export'],
            PRO: ['Unlimited events', '1000 attendees per event', 'Analytics dashboard', 'WhatsApp blast', 'Remove branding'],
            ENTERPRISE: ['Unlimited everything', 'White label', 'Priority support', 'Custom integrations'],
        };
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
            },
        });
        const userEmail = user?.identities[0]?.email;
        if (userEmail) {
            if (oldPlan === client_1.OrgPlan.STARTER) {
                this.emailService
                    .sendSubscriptionActivated({
                    email: userEmail,
                    userName: user.fullName || user.username || 'there',
                    plan,
                    billingCycle,
                    amount: Number(updated.amount),
                    expiresAt: this.formatDate(expiresAt),
                    features: planFeatures[plan] || [],
                })
                    .catch((err) => this.logger.error('Failed to send subscription activated email', err));
            }
            else {
                this.emailService
                    .sendSubscriptionUpgraded({
                    email: userEmail,
                    userName: user.fullName || user.username || 'there',
                    fromPlan: oldPlan,
                    toPlan: plan,
                    newFeatures: planFeatures[plan] || [],
                })
                    .catch((err) => this.logger.error('Failed to send subscription upgraded email', err));
            }
        }
        return updated;
    }
    async cancelSubscription(userId) {
        const subscription = await this.getMySubscription(userId);
        if (subscription.plan === client_1.OrgPlan.STARTER) {
            throw new common_1.BadRequestException('Cannot cancel free plan');
        }
        const oldPlan = subscription.plan;
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.subscriptionHistory.create({
                data: {
                    subscriptionId: subscription.id,
                    fromPlan: subscription.plan,
                    toPlan: client_1.OrgPlan.STARTER,
                    reason: 'User cancelled',
                },
            });
            return tx.orgSubscription.update({
                where: { id: subscription.id },
                data: {
                    plan: client_1.OrgPlan.STARTER,
                    isActive: true,
                    cancelledAt: new Date(),
                    expiresAt: null,
                    nextPaymentAt: null,
                },
            });
        });
        await this.cache.invalidatePlanCache(userId);
        this.logger.log(`Cancelled subscription for user ${userId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
            },
        });
        const userEmail = user?.identities[0]?.email;
        if (userEmail) {
            this.emailService
                .sendSubscriptionCancelled({
                email: userEmail,
                userName: user.fullName || user.username || 'there',
                plan: oldPlan,
                expiresAt: 'immediately',
            })
                .catch((err) => this.logger.error('Failed to send subscription cancelled email', err));
        }
        return updated;
    }
    async incrementEventUsage(userId) {
        const subscription = await this.getMySubscription(userId);
        if (subscription.usageResetAt < new Date()) {
            await this.prisma.orgSubscription.update({
                where: { id: subscription.id },
                data: {
                    eventsThisMonth: 1,
                    usageResetAt: this.getNextMonthStart(),
                },
            });
        }
        else {
            await this.prisma.orgSubscription.update({
                where: { id: subscription.id },
                data: {
                    eventsThisMonth: { increment: 1 },
                },
            });
        }
    }
    async getAllSubscriptions(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [subscriptions, total] = await Promise.all([
            this.prisma.orgSubscription.findMany({
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            username: true,
                            mobileNumber: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.orgSubscription.count(),
        ]);
        return {
            data: subscriptions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async adminUpdateSubscription(userId, dto) {
        const subscription = await this.getMySubscription(userId);
        if (dto.plan && dto.plan !== subscription.plan) {
            await this.prisma.subscriptionHistory.create({
                data: {
                    subscriptionId: subscription.id,
                    fromPlan: subscription.plan,
                    toPlan: dto.plan,
                    reason: dto.reason || 'Admin updated',
                },
            });
            const updated = await this.prisma.orgSubscription.update({
                where: { id: subscription.id },
                data: {
                    plan: dto.plan,
                },
            });
            await this.cache.invalidatePlanCache(userId);
            return updated;
        }
        return subscription;
    }
    getNextMonthStart() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    getNextYearStart() {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        date.setMonth(0);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    formatDate(date) {
        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        email_service_1.EmailService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map