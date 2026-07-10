import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto, UpdateNotificationSettingsDto } from './dto';
import { UserProfileDto } from '../auth/dto';
import { StorageService } from '../storage/storage.service';
export declare class UsersService {
    private readonly prisma;
    private readonly configService;
    private readonly storageService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, storageService: StorageService);
    getAllUsers(params: {
        page: number;
        limit: number;
        search?: string;
    }): Promise<{
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
    getUserByIdAdmin(userId: string): Promise<{
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
    updateUserByIdAdmin(userId: string, dto: UpdateProfileDto): Promise<{
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
    getMe(userId: string): Promise<UserProfileDto>;
    updateMe(userId: string, dto: UpdateProfileDto): Promise<UserProfileDto>;
    getUserByUsername(username: string): Promise<UserProfileDto>;
    checkUsernameAvailability(username: string): Promise<{
        available: boolean;
    }>;
    private isUsernameAvailable;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
        avatarUrl: string;
    }>;
    getUserIdentities(userId: string): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        provider: import("@prisma/client").$Enums.Provider;
        emailVerified: boolean | null;
        isPrimary: boolean;
    }[]>;
    setPrimaryIdentity(userId: string, identityId: string): Promise<{
        message: string;
    }>;
    removeIdentity(userId: string, identityId: string): Promise<{
        message: string;
    }>;
    getUserSpaces(userId: string): Promise<{
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
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    getNotificationSettings(userId: string): Promise<{
        pushEnabled: boolean;
        emailEnabled: boolean;
        eventReminders: boolean;
        newEvents: boolean;
        referralUpdates: boolean;
        promotions: boolean;
    }>;
    updateNotificationSettings(userId: string, dto: UpdateNotificationSettingsDto): Promise<{
        pushEnabled: boolean;
        emailEnabled: boolean;
        eventReminders: boolean;
        newEvents: boolean;
        referralUpdates: boolean;
        promotions: boolean;
    }>;
    private toNotificationSettingsDto;
}
