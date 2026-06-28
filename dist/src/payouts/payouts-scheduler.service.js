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
var PayoutsSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const payouts_service_1 = require("./payouts.service");
const client_1 = require("@prisma/client");
let PayoutsSchedulerService = PayoutsSchedulerService_1 = class PayoutsSchedulerService {
    prisma;
    payoutsService;
    logger = new common_1.Logger(PayoutsSchedulerService_1.name);
    constructor(prisma, payoutsService) {
        this.prisma = prisma;
        this.payoutsService = payoutsService;
    }
    async processScheduledPayouts() {
        this.logger.log('Checking for scheduled payouts to process...');
        const now = new Date();
        const due = await this.prisma.payout.findMany({
            where: { status: client_1.PayoutStatus.PENDING, scheduledAt: { lte: now }, type: 'T2' },
            select: { id: true },
        });
        if (due.length === 0) {
            this.logger.log('No payouts due');
            return;
        }
        this.logger.log(`Processing ${due.length} scheduled payouts`);
        for (const payout of due) {
            try {
                await this.payoutsService.processPayoutTransfer(payout.id);
                this.logger.log(`Auto-processed payout ${payout.id}`);
            }
            catch (err) {
                this.logger.error(`Failed to auto-process payout ${payout.id}`, err);
            }
        }
    }
    async autoCreatePayoutsForCompletedEvents() {
        this.logger.log('Auto-creating payouts for completed events...');
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
        const events = await this.prisma.event.findMany({
            where: {
                endDateTime: { gte: fourDaysAgo, lte: twoDaysAgo },
                status: 'COMPLETED',
                payouts: { none: {} },
                registrations: { some: { paymentStatus: 'PAID' } },
            },
            include: {
                creator: {
                    include: {
                        bankAccounts: {
                            where: { status: 'VERIFIED', isPrimary: true },
                            take: 1,
                        },
                    },
                },
            },
        });
        for (const event of events) {
            const primaryAccount = event.creator.bankAccounts[0];
            if (!primaryAccount) {
                this.logger.warn(`Event ${event.id} has revenue but organiser has no verified bank account — skipping`);
                continue;
            }
            try {
                await this.payoutsService.createPayout({ eventId: event.id, bankAccountId: primaryAccount.id, type: 'T2' }, 'SYSTEM');
                this.logger.log(`Auto-created T+2 payout for event ${event.id}`);
            }
            catch (err) {
                this.logger.error(`Failed to auto-create payout for event ${event.id}`, err);
            }
        }
    }
};
exports.PayoutsSchedulerService = PayoutsSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PayoutsSchedulerService.prototype, "processScheduledPayouts", null);
__decorate([
    (0, schedule_1.Cron)('0 6 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PayoutsSchedulerService.prototype, "autoCreatePayoutsForCompletedEvents", null);
exports.PayoutsSchedulerService = PayoutsSchedulerService = PayoutsSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payouts_service_1.PayoutsService])
], PayoutsSchedulerService);
//# sourceMappingURL=payouts-scheduler.service.js.map