import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { CreateSpaceDto, UpdateSpaceDto, UpdateSpaceStatusDto, CreateSpaceStatusRequestDto, ReviewSpaceStatusRequestDto } from './dto';
import { CreateSubSpaceRequestDto, ReviewSubSpaceRequestDto } from './dto/sub-space-request.dto';
import { SpaceStatus, SpaceVisibility } from '@prisma/client';
export declare class SpacesService {
    private readonly prisma;
    private readonly storageService;
    private readonly emailService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: StorageService, emailService: EmailService, configService: ConfigService);
    createSpace(dto: CreateSpaceDto, createdBy: string): Promise<{
        creator: {
            id: string;
            mobileNumber: string;
            username: string | null;
            fullName: string | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: import("@prisma/client").$Enums.SpaceStatus;
        createdBy: string;
        websiteUrl: string | null;
        plan: import("@prisma/client").$Enums.OrgPlan;
        logoUrl: string | null;
        bannerUrl: string | null;
        parentSpaceId: string | null;
        parentRequestPending: boolean;
        requestedParentId: string | null;
        planActivatedAt: Date | null;
        planExpiresAt: Date | null;
        coOrganiserLimit: number;
        submittedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        approvedBy: string | null;
        rejectionReason: string | null;
    }>;
    getAllSpaces(params: {
        page?: number;
        limit?: number;
        status?: SpaceStatus;
        visibility?: SpaceVisibility;
        search?: string;
        parentId?: string;
    }): Promise<{
        spaces: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSpaceById(id: string, userId?: string): Promise<any>;
    getSpaceBySlug(slug: string): Promise<any>;
    updateSpace(id: string, dto: UpdateSpaceDto): Promise<{
        creator: {
            id: string;
            username: string | null;
            fullName: string | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: import("@prisma/client").$Enums.SpaceStatus;
        createdBy: string;
        websiteUrl: string | null;
        plan: import("@prisma/client").$Enums.OrgPlan;
        logoUrl: string | null;
        bannerUrl: string | null;
        parentSpaceId: string | null;
        parentRequestPending: boolean;
        requestedParentId: string | null;
        planActivatedAt: Date | null;
        planExpiresAt: Date | null;
        coOrganiserLimit: number;
        submittedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        approvedBy: string | null;
        rejectionReason: string | null;
    }>;
    updateSpaceStatus(id: string, dto: UpdateSpaceStatusDto, approvedBy: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: import("@prisma/client").$Enums.SpaceStatus;
        createdBy: string;
        websiteUrl: string | null;
        plan: import("@prisma/client").$Enums.OrgPlan;
        logoUrl: string | null;
        bannerUrl: string | null;
        parentSpaceId: string | null;
        parentRequestPending: boolean;
        requestedParentId: string | null;
        planActivatedAt: Date | null;
        planExpiresAt: Date | null;
        coOrganiserLimit: number;
        submittedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        approvedBy: string | null;
        rejectionReason: string | null;
    }>;
    deleteSpace(id: string): Promise<{
        message: string;
    }>;
    uploadLogo(id: string, file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    uploadBanner(id: string, file: Express.Multer.File): Promise<{
        bannerUrl: string;
    }>;
    getSpaceMembers(spaceId: string): Promise<({
        role: {
            id: string;
            code: import("@prisma/client").$Enums.RoleCode;
            name: string;
            scope: import("@prisma/client").$Enums.RoleScope;
            createdAt: Date;
        };
        user: {
            id: string;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        spaceId: string | null;
        userId: string;
        roleId: string;
        assignedBy: string | null;
    })[]>;
    joinSpace(spaceId: string, userId: string): Promise<{
        message: string;
        userRole: {
            role: {
                id: string;
                code: import("@prisma/client").$Enums.RoleCode;
                name: string;
                scope: import("@prisma/client").$Enums.RoleScope;
                createdAt: Date;
            };
            space: {
                id: string;
                name: string;
                slug: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            spaceId: string | null;
            userId: string;
            roleId: string;
            assignedBy: string | null;
        };
    }>;
    leaveSpace(spaceId: string, userId: string): Promise<{
        message: string;
    }>;
    createSpaceRequest(userId: string, dto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: string;
        userId: string;
        websiteUrl: string | null;
        reviewNote: string | null;
        reviewedBy: string | null;
    }>;
    getMySpaceRequests(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: string;
        userId: string;
        websiteUrl: string | null;
        reviewNote: string | null;
        reviewedBy: string | null;
    }[]>;
    getAllSpaceRequests(status?: string): Promise<({
        user: {
            id: string;
            mobileNumber: string;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: string;
        userId: string;
        websiteUrl: string | null;
        reviewNote: string | null;
        reviewedBy: string | null;
    })[]>;
    approveSpaceRequest(requestId: string, adminId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: import("@prisma/client").$Enums.SpaceStatus;
        createdBy: string;
        websiteUrl: string | null;
        plan: import("@prisma/client").$Enums.OrgPlan;
        logoUrl: string | null;
        bannerUrl: string | null;
        parentSpaceId: string | null;
        parentRequestPending: boolean;
        requestedParentId: string | null;
        planActivatedAt: Date | null;
        planExpiresAt: Date | null;
        coOrganiserLimit: number;
        submittedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        approvedBy: string | null;
        rejectionReason: string | null;
    }>;
    rejectSpaceRequest(requestId: string, adminId: string, reviewNote?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.SpaceType;
        city: string | null;
        state: string | null;
        country: string | null;
        tags: string[];
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: string;
        userId: string;
        websiteUrl: string | null;
        reviewNote: string | null;
        reviewedBy: string | null;
    }>;
    createSpaceStatusRequest(userId: string, dto: CreateSpaceStatusRequestDto): Promise<{
        user: {
            id: string;
            username: string | null;
            fullName: string | null;
        };
        space: {
            id: string;
            name: string;
            slug: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        spaceId: string;
        reason: string;
        requestedStatus: string;
        reviewNote: string | null;
        reviewedBy: string | null;
        requestedBy: string;
        currentStatus: string;
        reviewedAt: Date | null;
    }>;
    getMySpaceStatusRequests(userId: string, spaceId?: string): Promise<({
        space: {
            id: string;
            name: string;
            slug: string;
            status: import("@prisma/client").$Enums.SpaceStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        spaceId: string;
        reason: string;
        requestedStatus: string;
        reviewNote: string | null;
        reviewedBy: string | null;
        requestedBy: string;
        currentStatus: string;
        reviewedAt: Date | null;
    })[]>;
    getAllSpaceStatusRequests(status?: string, page?: number, limit?: number): Promise<{
        requests: ({
            user: {
                id: string;
                mobileNumber: string;
                username: string | null;
                fullName: string | null;
            };
            space: {
                id: string;
                name: string;
                slug: string;
                status: import("@prisma/client").$Enums.SpaceStatus;
                logoUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            spaceId: string;
            reason: string;
            requestedStatus: string;
            reviewNote: string | null;
            reviewedBy: string | null;
            requestedBy: string;
            currentStatus: string;
            reviewedAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    reviewSpaceStatusRequest(requestId: string, adminId: string, dto: ReviewSpaceStatusRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        spaceId: string;
        reason: string;
        requestedStatus: string;
        reviewNote: string | null;
        reviewedBy: string | null;
        requestedBy: string;
        currentStatus: string;
        reviewedAt: Date | null;
    }>;
    createSubSpaceRequest(userId: string, dto: CreateSubSpaceRequestDto): Promise<{
        subSpace: {
            id: string;
            name: string;
            slug: string;
        } | null;
        targetSpace: {
            id: string;
            name: string;
            slug: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        reason: string;
        reviewNote: string | null;
        requestType: import("@prisma/client").$Enums.SubSpaceRequestType;
        subSpaceId: string | null;
        targetSpaceId: string;
        reviewedBy: string | null;
        requestedBy: string;
        reviewedAt: Date | null;
    }>;
    getMySubSpaceRequests(userId: string): Promise<({
        subSpace: {
            id: string;
            name: string;
            slug: string;
        } | null;
        targetSpace: {
            id: string;
            name: string;
            slug: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        reason: string;
        reviewNote: string | null;
        requestType: import("@prisma/client").$Enums.SubSpaceRequestType;
        subSpaceId: string | null;
        targetSpaceId: string;
        reviewedBy: string | null;
        requestedBy: string;
        reviewedAt: Date | null;
    })[]>;
    getAllSubSpaceRequests(status?: string, page?: number, limit?: number): Promise<{
        items: ({
            user: {
                id: string;
                mobileNumber: string;
                username: string | null;
                fullName: string | null;
                identities: {
                    email: string | null;
                }[];
            };
            subSpace: {
                id: string;
                name: string;
                slug: string;
                type: import("@prisma/client").$Enums.SpaceType;
                logoUrl: string | null;
            } | null;
            targetSpace: {
                id: string;
                name: string;
                slug: string;
                type: import("@prisma/client").$Enums.SpaceType;
                logoUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            reason: string;
            reviewNote: string | null;
            requestType: import("@prisma/client").$Enums.SubSpaceRequestType;
            subSpaceId: string | null;
            targetSpaceId: string;
            reviewedBy: string | null;
            requestedBy: string;
            reviewedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    reviewSubSpaceRequest(id: string, reviewerId: string, dto: ReviewSubSpaceRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        reason: string;
        reviewNote: string | null;
        requestType: import("@prisma/client").$Enums.SubSpaceRequestType;
        subSpaceId: string | null;
        targetSpaceId: string;
        reviewedBy: string | null;
        requestedBy: string;
        reviewedAt: Date | null;
    }>;
}
