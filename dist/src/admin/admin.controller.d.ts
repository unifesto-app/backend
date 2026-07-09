import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from '../users/dto';
import type { User } from '@prisma/client';
export declare class AdminController {
    private readonly adminService;
    private readonly usersService;
    private readonly logger;
    constructor(adminService: AdminService, usersService: UsersService);
    getHealth(): Promise<import("./admin.service").HealthResponse>;
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
    getUserById(id: string): Promise<{
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
    getAllSpaces(page?: string, limit?: string, search?: string): Promise<{
        spaces: {
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
            member_count: number;
            roleCounts: {
                organisers: number;
                coOrganisers: number;
                members: number;
            };
            creator: {
                id: string;
                username: string | null;
                fullName: string | null;
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAnalyticsOverview(): Promise<{
        users: {
            total: number;
            newLast30Days: number;
        };
        spaces: {
            total: number;
            active: number;
            pendingRequests: number;
        };
        events: {
            total: number;
            published: number;
        };
        registrations: {
            total: number;
        };
        revenue: {
            totalPaid: number | import("@prisma/client/runtime/library").Decimal;
        };
        generatedAt: string;
    }>;
    getAllEvents(page?: string, limit?: string, status?: string, search?: string): Promise<{
        events: ({
            space: {
                id: string;
                name: string;
                slug: string;
            };
            _count: {
                registrations: number;
            };
            creator: {
                id: string;
                username: string | null;
                fullName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            slug: string;
            description: string | null;
            updatedAt: Date;
            title: string;
            coverImageUrl: string | null;
            type: import("@prisma/client").$Enums.EventType;
            registrationType: import("@prisma/client").$Enums.RegistrationType;
            startDateTime: Date;
            endDateTime: Date;
            timezone: string;
            venueName: string | null;
            venueAddress: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            latitude: number | null;
            longitude: number | null;
            onlineUrl: string | null;
            onlinePlatform: string | null;
            capacity: number | null;
            registeredCount: number;
            waitlistEnabled: boolean;
            waitlistCount: number;
            isFree: boolean;
            tags: string[];
            category: string | null;
            visibility: import("@prisma/client").$Enums.EventVisibility;
            status: import("@prisma/client").$Enums.EventStatus;
            isRecurring: boolean;
            recurringRule: string | null;
            spaceId: string;
            createdBy: string;
            publishedAt: Date | null;
            cancelledAt: Date | null;
            cancellationReason: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getLogs(lines?: string, search?: string): Promise<{
        lines: string[];
        total: number;
        fetchedAt: string;
        error?: undefined;
    } | {
        lines: never[];
        total: number;
        error: string;
        fetchedAt: string;
    }>;
    registerDeviceToken(user: User, body: {
        fcmToken: string;
        platform?: string;
    }): Promise<{
        message: string;
    }>;
    unregisterDeviceToken(user: User, body: {
        fcmToken: string;
    }): Promise<{
        message: string;
    }>;
}
