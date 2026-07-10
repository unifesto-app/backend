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
var AdminSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const admin_email_service_1 = require("./admin-email.service");
let AdminSchedulerService = AdminSchedulerService_1 = class AdminSchedulerService {
    prisma;
    emailService;
    adminEmailService;
    logger = new common_1.Logger(AdminSchedulerService_1.name);
    constructor(prisma, emailService, adminEmailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.adminEmailService = adminEmailService;
    }
    async sendDailyAdminDigest() {
        this.logger.log('Running daily admin digest...');
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const [newUsers, newSpaces, newEvents, registrations, revenue] = await Promise.all([
            this.prisma.user.count({ where: { createdAt: { gte: yesterday } } }),
            this.prisma.space.count({ where: { createdAt: { gte: yesterday } } }),
            this.prisma.event.count({ where: { createdAt: { gte: yesterday } } }),
            this.prisma.eventRegistration.count({ where: { registeredAt: { gte: yesterday } } }),
            this.prisma.eventRegistration.aggregate({
                where: { registeredAt: { gte: yesterday }, paymentStatus: 'PAID' },
                _sum: { razorpayAmount: true }
            }),
        ]);
        const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';
        await this.emailService.sendDailyAdminDigest({
            adminEmail,
            date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            newUsers,
            newSpaces,
            newEvents,
            totalRegistrations: registrations,
            totalRevenue: Number(revenue._sum.razorpayAmount || 0),
            activeUsers: newUsers,
        }).catch(err => this.logger.error('Daily digest failed', err));
        this.logger.log('Daily admin digest sent');
    }
    async sendWeeklyReport() {
        this.logger.log('Running weekly report...');
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, newUsers, totalEvents, newEvents, revenue, registrations] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.event.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.eventRegistration.aggregate({
                where: { registeredAt: { gte: weekAgo }, paymentStatus: 'PAID' },
                _sum: { razorpayAmount: true }
            }),
            this.prisma.eventRegistration.count({ where: { registeredAt: { gte: weekAgo } } }),
        ]);
        const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';
        await this.emailService.sendWeeklyReport({
            adminEmail,
            weekStarting: weekAgo.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            metrics: [
                { label: 'Total Users', value: totalUsers.toLocaleString(), change: `+${newUsers} this week` },
                { label: 'Active Events', value: totalEvents.toLocaleString(), change: `+${newEvents} this week` },
                { label: 'Registrations', value: registrations.toLocaleString(), change: 'this week' },
                { label: 'Revenue', value: `₹${Number(revenue._sum.razorpayAmount || 0).toFixed(2)}`, change: 'this week' },
            ],
        }).catch(err => this.logger.error('Weekly report failed', err));
        this.logger.log('Weekly report sent');
    }
    async sendMonthlyInvoiceSummary() {
        this.logger.log('Running monthly invoice summary...');
        const now = new Date();
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [revenue, transactions, topEvents] = await Promise.all([
            this.prisma.eventRegistration.aggregate({
                where: { registeredAt: { gte: firstOfLastMonth, lte: firstOfThisMonth }, paymentStatus: 'PAID' },
                _sum: { razorpayAmount: true }
            }),
            this.prisma.eventRegistration.count({
                where: { registeredAt: { gte: firstOfLastMonth, lte: firstOfThisMonth }, paymentStatus: 'PAID' }
            }),
            this.prisma.event.findMany({
                where: { createdAt: { gte: firstOfLastMonth, lte: firstOfThisMonth } },
                orderBy: { registeredCount: 'desc' },
                take: 5,
                select: { title: true, registeredCount: true }
            })
        ]);
        const adminEmail = process.env.ADMIN_EMAIL || 'aws@unifesto.app';
        await this.emailService.sendMonthlyInvoiceSummary({
            adminEmail,
            month: firstOfLastMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
            totalRevenue: Number(revenue._sum.razorpayAmount || 0),
            totalTransactions: transactions,
            topEvents: topEvents.map(e => ({ title: e.title, revenue: e.registeredCount * 499 })),
        }).catch(err => this.logger.error('Monthly summary failed', err));
        this.logger.log('Monthly invoice summary sent');
    }
    async processScheduledCampaigns() {
        const now = new Date();
        const campaigns = await this.prisma.emailCampaign.findMany({
            where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
            take: 5,
        });
        for (const campaign of campaigns) {
            this.logger.log(`Processing scheduled campaign ${campaign.id}`);
            await this.adminEmailService.processScheduledCampaign(campaign.id)
                .catch(err => this.logger.error(`Campaign ${campaign.id} failed`, err));
        }
    }
};
exports.AdminSchedulerService = AdminSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSchedulerService.prototype, "sendDailyAdminDigest", null);
__decorate([
    (0, schedule_1.Cron)('0 9 * * 1'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSchedulerService.prototype, "sendWeeklyReport", null);
__decorate([
    (0, schedule_1.Cron)('0 7 1 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSchedulerService.prototype, "sendMonthlyInvoiceSummary", null);
__decorate([
    (0, schedule_1.Cron)('*/10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSchedulerService.prototype, "processScheduledCampaigns", null);
exports.AdminSchedulerService = AdminSchedulerService = AdminSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        admin_email_service_1.AdminEmailService])
], AdminSchedulerService);
//# sourceMappingURL=admin-scheduler.service.js.map