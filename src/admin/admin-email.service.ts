import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { EmailCampaignStatus, EmailLogStatus, EmailTargetType } from '@prisma/client';

// DTOs
export interface SendToUserDto {
  userId: string;
  subject: string;
  body: string;
  scheduledAt?: Date;
}

export interface SendToSpaceDto {
  spaceId: string;
  subject: string;
  body: string;
  scheduledAt?: Date;
}

export interface SendToEventDto {
  eventId: string;
  subject: string;
  body: string;
  includeWaitlist?: boolean;
  scheduledAt?: Date;
}

export interface SendToAllDto {
  subject: string;
  body: string;
  scheduledAt?: Date;
}

export interface SendToOrganisersDto {
  subject: string;
  body: string;
  scheduledAt?: Date;
}

export interface SendToWaitlistDto {
  eventId: string;
  subject: string;
  body: string;
  scheduledAt?: Date;
}

export interface SendToSegmentDto {
  subject: string;
  body: string;
  filters: {
    city?: string[];
    plan?: string[];
    joinedAfter?: string;
    joinedBefore?: string;
    hasWallet?: boolean;
    minCoins?: number;
    hasRegistrations?: boolean;
    isOnboarded?: boolean;
  };
  scheduledAt?: Date;
}

@Injectable()
export class AdminEmailService {
  private readonly logger = new Logger(AdminEmailService.name);
  private readonly BATCH_SIZE = 100; // SES batch limit

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send email to a specific user
   */
  async sendToUser(adminId: string, dto: SendToUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { identities: { select: { email: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const email = user.identities.find((i) => i.email)?.email;
    if (!email) {
      throw new BadRequestException('User has no email address');
    }

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        sentBy: adminId,
        targetType: EmailTargetType.SINGLE_USER,
        targetId: dto.userId,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.PENDING,
      },
    });

    if (!dto.scheduledAt) {
      await this.processCampaign(campaign.id);
    }

    return { success: true, campaignId: campaign.id };
  }

  /**
   * Send email to all members of a space
   */
  async sendToSpace(adminId: string, dto: SendToSpaceDto) {
    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        sentBy: adminId,
        targetType: EmailTargetType.SPACE_MEMBERS,
        targetId: dto.spaceId,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.PENDING,
      },
    });

    if (!dto.scheduledAt) {
      await this.processCampaign(campaign.id);
    }

    return { success: true, campaignId: campaign.id };
  }


  /**
   * Send email to all registrants of an event
   */
  async sendToEvent(adminId: string, dto: SendToEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        sentBy: adminId,
        targetType: dto.includeWaitlist ? EmailTargetType.WAITLIST : EmailTargetType.EVENT_REGISTRANTS,
        targetId: dto.eventId,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.PENDING,
      },
    });

    if (!dto.scheduledAt) {
      await this.processCampaign(campaign.id);
    }

    return { success: true, campaignId: campaign.id };
  }

  /**
   * Send email to all platform users
   */
  async sendToAll(adminId: string, dto: SendToAllDto) {
    const campaign = await this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        sentBy: adminId,
        targetType: EmailTargetType.ALL_USERS,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.PENDING,
      },
    });

    if (!dto.scheduledAt) {
      await this.processCampaign(campaign.id);
    }

    return { success: true, campaignId: campaign.id };
  }

  /**
   * Send email to all organisers
   */
  async sendToOrganisers(adminId: string, dto: SendToOrganisersDto) {
    const campaign = await this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        sentBy: adminId,
        targetType: EmailTargetType.ORGANISERS_ONLY,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.PENDING,
      },
    });

    if (!dto.scheduledAt) {
      await this.processCampaign(campaign.id);
    }

    return { success: true, campaignId: campaign.id };
  }

  /**
   * Send email to waitlisted users of an event
   */
  async sendToWaitlist(adminId: string, dto: SendToWaitlistDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        sentBy: adminId,
        targetType: EmailTargetType.WAITLIST,
        targetId: dto.eventId,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.PENDING,
      },
    });

    if (!dto.scheduledAt) {
      await this.processCampaign(campaign.id);
    }

    return { success: true, campaignId: campaign.id };
  }


  /**
   * Send email to a filtered segment of users
   */
  async sendToSegment(adminId: string, dto: SendToSegmentDto) {
    const campaign = await this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        sentBy: adminId,
        targetType: EmailTargetType.SEGMENT,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.PENDING,
      },
    });

    if (!dto.scheduledAt) {
      await this.processCampaign(campaign.id, dto.filters);
    }

    return { success: true, campaignId: campaign.id };
  }

  /**
   * Get all campaigns with pagination
   */
  async getCampaigns(page: number = 1, limit: number = 20) {
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

  /**
   * Get campaign by ID with logs
   */
  async getCampaignById(id: string) {
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
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelCampaign(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== EmailCampaignStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled campaigns can be cancelled');
    }

    await this.prisma.emailCampaign.update({
      where: { id },
      data: { status: EmailCampaignStatus.FAILED },
    });

    return { success: true, message: 'Campaign cancelled' };
  }


  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  /**
   * Process a campaign by getting recipients and sending in batches
   */
  private async processCampaign(campaignId: string, filters?: any): Promise<void> {
    try {
      const campaign = await this.prisma.emailCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) return;

      await this.prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: EmailCampaignStatus.SENDING },
      });

      const recipients = await this.getRecipients(campaign, filters);

      if (recipients.length === 0) {
        await this.prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { status: EmailCampaignStatus.SENT, totalSent: 0 },
        });
        return;
      }

      let totalSent = 0;
      let failedCount = 0;

      // Process in batches
      for (let i = 0; i < recipients.length; i += this.BATCH_SIZE) {
        const batch = recipients.slice(i, i + this.BATCH_SIZE);
        const results = await this.sendBatch(campaign, batch);
        totalSent += results.sent;
        failedCount += results.failed;

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await this.prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: EmailCampaignStatus.SENT,
          totalSent,
          failedCount,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Campaign ${campaignId} completed: ${totalSent} sent, ${failedCount} failed`);
    } catch (error) {
      this.logger.error(`Campaign ${campaignId} failed: ${error.message}`);
      await this.prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: EmailCampaignStatus.FAILED },
      });
    }
  }


  /**
   * Get recipients based on campaign target type
   */
  private async getRecipients(campaign: any, filters?: any): Promise<{ email: string; userId?: string }[]> {
    switch (campaign.targetType) {
      case EmailTargetType.SINGLE_USER:
        const user = await this.prisma.user.findUnique({
          where: { id: campaign.targetId },
          include: { identities: { select: { email: true } } },
        });
        const email = user?.identities.find((i) => i.email)?.email;
        return email ? [{ email, userId: user.id }] : [];

      case EmailTargetType.SPACE_MEMBERS:
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
          .filter((r) => r.email) as { email: string; userId: string }[];

      case EmailTargetType.EVENT_REGISTRANTS:
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
          .filter((r) => r.email) as { email: string; userId: string }[];

      case EmailTargetType.WAITLIST:
        // For waitlist, we might need to add a separate waitlist table or use registration with a different status
        // For now, return empty array since there's no WAITLISTED status
        return [];

      case EmailTargetType.ALL_USERS:
        const allUsers = await this.prisma.user.findMany({
          include: { identities: { select: { email: true } } },
        });
        return allUsers
          .map((u) => ({
            email: u.identities.find((i) => i.email)?.email,
            userId: u.id,
          }))
          .filter((r) => r.email) as { email: string; userId: string }[];

      case EmailTargetType.ORGANISERS_ONLY:
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
          .filter((r) => r.email) as { email: string; userId: string }[];

      case EmailTargetType.SEGMENT:
        const where: any = {};
        if (filters?.city) where.city = { in: filters.city };
        if (filters?.joinedAfter) where.createdAt = { gte: new Date(filters.joinedAfter) };
        if (filters?.joinedBefore) where.createdAt = { ...where.createdAt, lte: new Date(filters.joinedBefore) };

        const segmentUsers = await this.prisma.user.findMany({
          where,
          include: { identities: { select: { email: true } } },
        });
        return segmentUsers
          .map((u) => ({
            email: u.identities.find((i) => i.email)?.email,
            userId: u.id,
          }))
          .filter((r) => r.email) as { email: string; userId: string }[];

      default:
        return [];
    }
  }


  /**
   * Send batch of emails using SES
   */
  private async sendBatch(
    campaign: any,
    batch: { email: string; userId?: string }[],
  ): Promise<{ sent: number; failed: number }> {
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
              status: EmailLogStatus.SENT,
              sesMessageId: result.messageId,
              sentAt: new Date(),
            },
          });
        } else {
          failed++;
          await this.prisma.emailCampaignLog.create({
            data: {
              campaignId: campaign.id,
              recipientEmail: recipient.email,
              userId: recipient.userId,
              status: EmailLogStatus.FAILED,
              errorMessage: result.error || 'Unknown error',
            },
          });
        }
      } catch (error) {
        failed++;
        await this.prisma.emailCampaignLog.create({
          data: {
            campaignId: campaign.id,
            recipientEmail: recipient.email,
            userId: recipient.userId,
            status: EmailLogStatus.FAILED,
            errorMessage: error.message,
          },
        });
      }
    }

    return { sent, failed };
  }
}
