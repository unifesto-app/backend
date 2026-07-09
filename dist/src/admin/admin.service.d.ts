import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
export interface ServiceStatus {
    status: 'connected' | 'disconnected';
    latency: number;
    message: string;
}
export interface AppStatus {
    status: 'online';
    uptime: number;
    memoryMB: number;
}
export interface HealthResponse {
    status: 'healthy' | 'degraded' | 'down';
    timestamp: string;
    services: {
        database: ServiceStatus;
        redis: ServiceStatus;
        storage: ServiceStatus;
        app: AppStatus;
    };
}
export declare class AdminService {
    private readonly prisma;
    private readonly redis;
    private readonly storage;
    private readonly configService;
    private readonly emailService;
    private readonly logger;
    private readonly s3Client;
    private readonly bucketName;
    private readonly startTime;
    constructor(prisma: PrismaService, redis: RedisService, storage: StorageService, configService: ConfigService, emailService: EmailService);
    getHealthStatus(): Promise<HealthResponse>;
    private checkDatabaseHealth;
    private checkRedisHealth;
    private checkStorageHealth;
    private checkAppHealth;
    sendExpiringSubscriptionEmails(): Promise<void>;
    private formatDate;
    registerDeviceToken(userId: string, fcmToken: string, platform: string): Promise<{
        message: string;
    }>;
    unregisterDeviceToken(userId: string, fcmToken: string): Promise<{
        message: string;
    }>;
    sendPushToAdmins(title: string, body: string, data?: Record<string, string>): Promise<void>;
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
    getPm2Logs(params: {
        lines: number;
        search?: string;
    }): Promise<{
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
    getAllEvents(params: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
    }): Promise<{
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
}
