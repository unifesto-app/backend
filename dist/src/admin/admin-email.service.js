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
var AdminEmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
let AdminEmailService = AdminEmailService_1 = class AdminEmailService {
    prisma;
    emailService;
    logger = new common_1.Logger(AdminEmailService_1.name);
    BATCH_SIZE = 100;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async sendToUser(adminId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
            include: { identities: { select: { email: true } } },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const email = user.identities.find((i) => i.email)?.email;
        if (!email) {
            throw new common_1.BadRequestException('User has no email address');
        }
        const campaign = await this.prisma.emailCampaign.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                sentBy: adminId,
                targetType: client_1.EmailTargetType.SINGLE_USER,
                targetId: dto.userId,
                scheduledAt: dto.scheduledAt,
                status: dto.scheduledAt ? client_1.EmailCampaignStatus.SCHEDULED : client_1.EmailCampaignStatus.PENDING,
            },
        });
        if (!dto.scheduledAt) {
            await this.processCampaign(campaign.id);
        }
        return { success: true, campaignId: campaign.id };
    }
    async sendToSpace(adminId, dto) {
        const space = await this.prisma.space.findUnique({
            where: { id: dto.spaceId },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        const campaign = await this.prisma.emailCampaign.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                sentBy: adminId,
                targetType: client_1.EmailTargetType.SPACE_MEMBERS,
                targetId: dto.spaceId,
                scheduledAt: dto.scheduledAt,
                status: dto.scheduledAt ? client_1.EmailCampaignStatus.SCHEDULED : client_1.EmailCampaignStatus.PENDING,
            },
        });
        if (!dto.scheduledAt) {
            await this.processCampaign(campaign.id);
        }
        return { success: true, campaignId: campaign.id };
    }
    async sendToEvent(adminId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const campaign = await this.prisma.emailCampaign.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                sentBy: adminId,
                targetType: dto.includeWaitlist ? client_1.EmailTargetType.WAITLIST : client_1.EmailTargetType.EVENT_REGISTRANTS,
                targetId: dto.eventId,
                scheduledAt: dto.scheduledAt,
                status: dto.scheduledAt ? client_1.EmailCampaignStatus.SCHEDULED : client_1.EmailCampaignStatus.PENDING,
            },
        });
        if (!dto.scheduledAt) {
            await this.processCampaign(campaign.id);
        }
        return { success: true, campaignId: campaign.id };
    }
    async sendToAll(adminId, dto) {
        const campaign = await this.prisma.emailCampaign.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                sentBy: adminId,
                targetType: client_1.EmailTargetType.ALL_USERS,
                scheduledAt: dto.scheduledAt,
                status: dto.scheduledAt ? client_1.EmailCampaignStatus.SCHEDULED : client_1.EmailCampaignStatus.PENDING,
            },
        });
        if (!dto.scheduledAt) {
            await this.processCampaign(campaign.id);
        }
        return { success: true, campaignId: campaign.id };
    }
    async sendToOrganisers(adminId, dto) {
        const campaign = await this.prisma.emailCampaign.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                sentBy: adminId,
                targetType: client_1.EmailTargetType.ORGANISERS_ONLY,
                scheduledAt: dto.scheduledAt,
                status: dto.scheduledAt ? client_1.EmailCampaignStatus.SCHEDULED : client_1.EmailCampaignStatus.PENDING,
            },
        });
        if (!dto.scheduledAt) {
            await this.processCampaign(campaign.id);
        }
        return { success: true, campaignId: campaign.id };
    }
    async sendToWaitlist(adminId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const campaign = await this.prisma.emailCampaign.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                sentBy: adminId,
                targetType: client_1.EmailTargetType.WAITLIST,
                targetId: dto.eventId,
                scheduledAt: dto.scheduledAt,
                status: dto.scheduledAt ? client_1.EmailCampaignStatus.SCHEDULED : client_1.EmailCampaignStatus.PENDING,
            },
        });
        if (!dto.scheduledAt) {
            await this.processCampaign(campaign.id);
        }
        return { success: true, campaignId: campaign.id };
    }
    async sendToSegment(adminId, dto) {
        const campaign = await this.prisma.emailCampaign.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                sentBy: adminId,
                targetType: client_1.EmailTargetType.SEGMENT,
                scheduledAt: dto.scheduledAt,
                status: dto.scheduledAt ? client_1.EmailCampaignStatus.SCHEDULED : client_1.EmailCampaignStatus.PENDING,
            },
        });
        if (!dto.scheduledAt) {
            await this.processCampaign(campaign.id, dto.filters);
        }
        return { success: true, campaignId: campaign.id };
    }
    async getCampaigns(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [campaigns, total] = await Promise.all([
            this.prisma.emailCampaign.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { logs: true },
                    },
                },
            }),
            this.prisma.emailCampaign.count(),
        ]);
        return {
            data: campaigns,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getCampaignById(id) {
        const campaign = await this.prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                logs: {
                    orderBy: { sentAt: 'desc' },
                    take: 100,
                },
            },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        return campaign;
    }
    async cancelCampaign(id) {
        const campaign = await this.prisma.emailCampaign.findUnique({
            where: { id },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        if (campaign.status !== client_1.EmailCampaignStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Only scheduled campaigns can be cancelled');
        }
        await this.prisma.emailCampaign.update({
            where: { id },
            data: { status: client_1.EmailCampaignStatus.FAILED },
        });
        return { success: true, message: 'Campaign cancelled' };
    }
    async processScheduledCampaign(campaignId) {
        return this.processCampaign(campaignId);
    }
    async processCampaign(campaignId, filters) {
        try {
            const campaign = await this.prisma.emailCampaign.findUnique({
                where: { id: campaignId },
            });
            if (!campaign)
                return;
            await this.prisma.emailCampaign.update({
                where: { id: campaignId },
                data: { status: client_1.EmailCampaignStatus.SENDING },
            });
            const recipients = await this.getRecipients(campaign, filters);
            if (recipients.length === 0) {
                await this.prisma.emailCampaign.update({
                    where: { id: campaignId },
                    data: { status: client_1.EmailCampaignStatus.SENT, totalSent: 0 },
                });
                return;
            }
            let totalSent = 0;
            let failedCount = 0;
            for (let i = 0; i < recipients.length; i += this.BATCH_SIZE) {
                const batch = recipients.slice(i, i + this.BATCH_SIZE);
                const results = await this.sendBatch(campaign, batch);
                totalSent += results.sent;
                failedCount += results.failed;
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            await this.prisma.emailCampaign.update({
                where: { id: campaignId },
                data: {
                    status: client_1.EmailCampaignStatus.SENT,
                    totalSent,
                    failedCount,
                    sentAt: new Date(),
                },
            });
            this.logger.log(`Campaign ${campaignId} completed: ${totalSent} sent, ${failedCount} failed`);
        }
        catch (error) {
            this.logger.error(`Campaign ${campaignId} failed: ${error.message}`);
            await this.prisma.emailCampaign.update({
                where: { id: campaignId },
                data: { status: client_1.EmailCampaignStatus.FAILED },
            });
        }
    }
    async getRecipients(campaign, filters) {
        switch (campaign.targetType) {
            case client_1.EmailTargetType.SINGLE_USER:
                const user = await this.prisma.user.findUnique({
                    where: { id: campaign.targetId },
                    include: { identities: { select: { email: true } } },
                });
                const email = user?.identities.find((i) => i.email)?.email;
                return email ? [{ email, userId: user.id }] : [];
            case client_1.EmailTargetType.SPACE_MEMBERS:
                const spaceMembers = await this.prisma.userRole.findMany({
                    where: { spaceId: campaign.targetId },
                    include: {
                        user: {
                            include: { identities: { select: { email: true } } },
                        },
                    },
                });
                return spaceMembers
                    .map((m) => ({
                    email: m.user.identities.find((i) => i.email)?.email,
                    userId: m.userId,
                }))
                    .filter((r) => r.email);
            case client_1.EmailTargetType.EVENT_REGISTRANTS:
                const registrations = await this.prisma.eventRegistration.findMany({
                    where: {
                        eventId: campaign.targetId,
                        status: { in: ['REGISTERED', 'ATTENDED'] }
                    },
                    select: {
                        userId: true,
                    },
                });
                const regUserIds = registrations.map(r => r.userId);
                const regUsers = await this.prisma.user.findMany({
                    where: { id: { in: regUserIds } },
                    include: { identities: { select: { email: true } } },
                });
                return regUsers
                    .map((u) => ({
                    email: u.identities.find((i) => i.email)?.email,
                    userId: u.id,
                }))
                    .filter((r) => r.email);
            case client_1.EmailTargetType.WAITLIST:
                return [];
            case client_1.EmailTargetType.ALL_USERS:
                const allUsers = await this.prisma.user.findMany({
                    include: { identities: { select: { email: true } } },
                });
                return allUsers
                    .map((u) => ({
                    email: u.identities.find((i) => i.email)?.email,
                    userId: u.id,
                }))
                    .filter((r) => r.email);
            case client_1.EmailTargetType.ORGANISERS_ONLY:
                const organisers = await this.prisma.user.findMany({
                    where: {
                        createdSpaces: {
                            some: {},
                        },
                    },
                    include: { identities: { select: { email: true } } },
                    distinct: ['id'],
                });
                return organisers
                    .map((u) => ({
                    email: u.identities.find((i) => i.email)?.email,
                    userId: u.id,
                }))
                    .filter((r) => r.email);
            case client_1.EmailTargetType.SEGMENT:
                const where = {};
                if (filters?.city)
                    where.city = { in: filters.city };
                if (filters?.joinedAfter)
                    where.createdAt = { gte: new Date(filters.joinedAfter) };
                if (filters?.joinedBefore)
                    where.createdAt = { ...where.createdAt, lte: new Date(filters.joinedBefore) };
                const segmentUsers = await this.prisma.user.findMany({
                    where,
                    include: { identities: { select: { email: true } } },
                });
                return segmentUsers
                    .map((u) => ({
                    email: u.identities.find((i) => i.email)?.email,
                    userId: u.id,
                }))
                    .filter((r) => r.email);
            default:
                return [];
        }
    }
    async sendBatch(campaign, batch) {
        let sent = 0;
        let failed = 0;
        for (const recipient of batch) {
            try {
                const result = await this.emailService.sendCustomCampaignEmail({
                    to: recipient.email,
                    subject: campaign.subject,
                    html: campaign.body,
                    campaignId: campaign.id,
                });
                if (result.messageId) {
                    sent++;
                    await this.prisma.emailCampaignLog.create({
                        data: {
                            campaignId: campaign.id,
                            recipientEmail: recipient.email,
                            userId: recipient.userId,
                            status: client_1.EmailLogStatus.SENT,
                            sesMessageId: result.messageId,
                            sentAt: new Date(),
                        },
                    });
                }
                else {
                    failed++;
                    await this.prisma.emailCampaignLog.create({
                        data: {
                            campaignId: campaign.id,
                            recipientEmail: recipient.email,
                            userId: recipient.userId,
                            status: client_1.EmailLogStatus.FAILED,
                            errorMessage: result.error || 'Unknown error',
                        },
                    });
                }
            }
            catch (error) {
                failed++;
                await this.prisma.emailCampaignLog.create({
                    data: {
                        campaignId: campaign.id,
                        recipientEmail: recipient.email,
                        userId: recipient.userId,
                        status: client_1.EmailLogStatus.FAILED,
                        errorMessage: error.message,
                    },
                });
            }
        }
        return { sent, failed };
    }
};
exports.AdminEmailService = AdminEmailService;
exports.AdminEmailService = AdminEmailService = AdminEmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], AdminEmailService);
//# sourceMappingURL=admin-email.service.js.map