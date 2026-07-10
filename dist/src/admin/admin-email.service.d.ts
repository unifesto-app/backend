import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
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
    };
    scheduledAt?: Date;
}
export declare class AdminEmailService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    private readonly BATCH_SIZE;
    constructor(prisma: PrismaService, emailService: EmailService);
    sendToUser(adminId: string, dto: SendToUserDto): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToSpace(adminId: string, dto: SendToSpaceDto): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToEvent(adminId: string, dto: SendToEventDto): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToAll(adminId: string, dto: SendToAllDto): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToOrganisers(adminId: string, dto: SendToOrganisersDto): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToWaitlist(adminId: string, dto: SendToWaitlistDto): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToSegment(adminId: string, dto: SendToSegmentDto): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    getCampaigns(page?: number, limit?: number): Promise<{
        data: ({
            _count: {
                logs: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.EmailCampaignStatus;
            subject: string;
            scheduledAt: Date | null;
            body: string;
            targetType: import("@prisma/client").$Enums.EmailTargetType;
            targetId: string | null;
            segmentFilters: import("@prisma/client/runtime/library").JsonValue | null;
            totalSent: number;
            failedCount: number;
            sentAt: Date | null;
            sentBy: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getCampaignById(id: string): Promise<{
        logs: {
            id: string;
            status: import("@prisma/client").$Enums.EmailLogStatus;
            userId: string | null;
            errorMessage: string | null;
            sentAt: Date;
            recipientEmail: string;
            sesMessageId: string | null;
            campaignId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.EmailCampaignStatus;
        subject: string;
        scheduledAt: Date | null;
        body: string;
        targetType: import("@prisma/client").$Enums.EmailTargetType;
        targetId: string | null;
        segmentFilters: import("@prisma/client/runtime/library").JsonValue | null;
        totalSent: number;
        failedCount: number;
        sentAt: Date | null;
        sentBy: string;
    }>;
    cancelCampaign(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    processScheduledCampaign(campaignId: string): Promise<void>;
    private processCampaign;
    private getRecipients;
    private sendBatch;
}
