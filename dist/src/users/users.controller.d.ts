import { UsersService } from './users.service';
import { UpdateProfileDto, CheckUsernameDto, UpdateNotificationSettingsDto } from './dto';
import type { User } from '@prisma/client';
import { UserProfileDto } from '../auth/dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: User): Promise<UserProfileDto>;
    updateMe(user: User, dto: UpdateProfileDto): Promise<UserProfileDto>;
    deleteMe(user: User): Promise<{
        message: string;
    }>;
    uploadAvatar(user: User, file: Express.Multer.File): Promise<{
        avatarUrl: string;
    }>;
    getMyIdentities(user: User): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        provider: import("@prisma/client").$Enums.Provider;
        emailVerified: boolean | null;
        isPrimary: boolean;
    }[]>;
    setPrimaryIdentity(user: User, id: string): Promise<{
        message: string;
    }>;
    removeIdentity(user: User, id: string): Promise<{
        message: string;
    }>;
    getMySpaces(user: User): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        visibility: import("@prisma/client").$Enums.SpaceVisibility;
        status: import("@prisma/client").$Enums.SpaceStatus;
        type: import("@prisma/client").$Enums.SpaceType;
        parentSpaceId: string | null;
        sub_org_count: number;
        member_count: number;
        event_count: number;
        creator: {
            id: string;
            username: string | null;
            fullName: string | null;
        };
        userRole: {
            id: string;
            code: import("@prisma/client").$Enums.RoleCode;
            name: string;
        };
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getNotificationSettings(user: User): Promise<{
        pushEnabled: boolean;
        emailEnabled: boolean;
        eventReminders: boolean;
        newEvents: boolean;
        referralUpdates: boolean;
        promotions: boolean;
    }>;
    updateNotificationSettings(user: User, dto: UpdateNotificationSettingsDto): Promise<{
        pushEnabled: boolean;
        emailEnabled: boolean;
        eventReminders: boolean;
        newEvents: boolean;
        referralUpdates: boolean;
        promotions: boolean;
    }>;
    checkUsername(dto: CheckUsernameDto): Promise<{
        available: boolean;
    }>;
    getAllUsers(page?: string, limit?: string, search?: string): Promise<{
        users: {
            id: string;
            mobileNumber: string;
            mobileVerified: boolean;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
            bio: string | null;
            linkedinUrl: string | null;
            instagramUrl: string | null;
            githubUrl: string | null;
            websiteUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            emailVerified: boolean;
            roles: import("@prisma/client").$Enums.RoleCode[];
            identitiesCount: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserById(id: string): Promise<UserProfileDto | {
        user: {
            id: string;
            mobileNumber: string;
            mobileVerified: boolean;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
            bio: string | null;
            linkedinUrl: string | null;
            instagramUrl: string | null;
            githubUrl: string | null;
            websiteUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            emailVerified: boolean;
            roles: {
                id: string;
                code: import("@prisma/client").$Enums.RoleCode;
                name: string;
                scope: import("@prisma/client").$Enums.RoleScope;
                spaceId: string | null;
                spaceName: string | null;
                spaceSlug: string | null;
                assignedBy: {
                    id: string;
                    username: string | null;
                    fullName: string | null;
                } | null;
                assignedAt: Date;
            }[];
            identities: {
                id: string;
                createdAt: Date;
                email: string | null;
                provider: import("@prisma/client").$Enums.Provider;
                emailVerified: boolean | null;
                isPrimary: boolean;
            }[];
        };
    }>;
    updateUserById(id: string, dto: UpdateProfileDto): Promise<{
        user: {
            id: string;
            mobileNumber: string;
            mobileVerified: boolean;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
            bio: string | null;
            linkedinUrl: string | null;
            instagramUrl: string | null;
            githubUrl: string | null;
            websiteUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            emailVerified: boolean;
            roles: import("@prisma/client").$Enums.RoleCode[];
        };
        message: string;
    }>;
}
