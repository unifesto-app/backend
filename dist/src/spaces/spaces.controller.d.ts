import { SpacesService } from './spaces.service';
import { CreateSpaceDto, UpdateSpaceDto, UpdateSpaceStatusDto, CreateSpaceStatusRequestDto, ReviewSpaceStatusRequestDto } from './dto';
import { CreateSpaceRequestDto } from './dto/create-space-request.dto';
import { SpaceStatus, SpaceVisibility } from '@prisma/client';
import type { User } from '@prisma/client';
export declare class SpacesController {
    private readonly spacesService;
    constructor(spacesService: SpacesService);
    createSpace(dto: CreateSpaceDto, user: User): Promise<{
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
    getAllSpaces(page?: string, limit?: string, status?: SpaceStatus, visibility?: SpaceVisibility, search?: string, parentId?: string): Promise<{
        spaces: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSpaceBySlug(slug: string): Promise<any>;
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
    getMySpaceRequests(user: User): Promise<{
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
    approveSpaceRequest(id: string, user: User): Promise<{
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
    rejectSpaceRequest(id: string, body: {
        reviewNote?: string;
    }, user: User): Promise<{
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
    createSpaceStatusRequest(user: User, dto: CreateSpaceStatusRequestDto): Promise<{
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
    getMySpaceStatusRequests(user: User, spaceId?: string): Promise<({
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
    reviewSpaceStatusRequest(user: User, id: string, dto: ReviewSpaceStatusRequestDto): Promise<{
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
    getSpaceById(id: string, auth?: string): Promise<any>;
    joinSpace(id: string, user: User): Promise<{
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
    leaveSpace(id: string, user: User): Promise<{
        message: string;
    }>;
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
    updateSpaceStatus(id: string, dto: UpdateSpaceStatusDto, user: User): Promise<{
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
    getSpaceMembers(id: string): Promise<({
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
    createSpaceRequest(dto: CreateSpaceRequestDto, user: User): Promise<{
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
}
