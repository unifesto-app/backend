import { AdminService } from './admin.service';
import type { User } from '@prisma/client';
export declare class AdminController {
    private readonly adminService;
    private readonly logger;
    constructor(adminService: AdminService);
    getHealth(): Promise<import("./admin.service").HealthResponse>;
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
