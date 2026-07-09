import type { User } from '@prisma/client';
import { AdminEmailService } from './admin-email.service';
export declare class AdminEmailController {
    private readonly adminEmailService;
    constructor(adminEmailService: AdminEmailService);
    sendToUser(user: User, dto: any): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToSpace(user: User, dto: any): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToEvent(user: User, dto: any): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToAll(user: User, dto: any): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToOrganisers(user: User, dto: any): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToWaitlist(user: User, dto: any): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    sendToSegment(user: User, dto: any): Promise<{
        success: boolean;
        campaignId: string;
    }>;
    getCampaigns(page?: string, limit?: string): Promise<{
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
}
