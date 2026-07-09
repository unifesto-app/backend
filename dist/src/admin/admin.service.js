"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const storage_service_1 = require("../storage/storage.service");
const email_service_1 = require("../email/email.service");
const client_s3_1 = require("@aws-sdk/client-s3");
const firebase_admin_provider_1 = require("../firebase/firebase-admin.provider");
let AdminService = AdminService_1 = class AdminService {
    prisma;
    redis;
    storage;
    configService;
    emailService;
    logger = new common_1.Logger(AdminService_1.name);
    s3Client;
    bucketName;
    startTime;
    constructor(prisma, redis, storage, configService, emailService) {
        this.prisma = prisma;
        this.redis = redis;
        this.storage = storage;
        this.configService = configService;
        this.emailService = emailService;
        this.startTime = Date.now();
        const region = this.configService.get('AWS_REGION');
        this.bucketName = this.configService.get('S3_BUCKET_NAME') || '';
        this.s3Client = new client_s3_1.S3Client({
            region: region,
        });
    }
    async getHealthStatus() {
        const timestamp = new Date().toISOString();
        const [database, redis, storage, app] = await Promise.all([
            this.checkDatabaseHealth(),
            this.checkRedisHealth(),
            this.checkStorageHealth(),
            this.checkAppHealth(),
        ]);
        const connectedServices = [
            database.status === 'connected',
            redis.status === 'connected',
            storage.status === 'connected',
        ];
        const allConnected = connectedServices.every((s) => s === true);
        const allDisconnected = connectedServices.every((s) => s === false);
        let overallStatus;
        if (allConnected) {
            overallStatus = 'healthy';
        }
        else if (allDisconnected) {
            overallStatus = 'down';
        }
        else {
            overallStatus = 'degraded';
        }
        return {
            status: overallStatus,
            timestamp,
            services: {
                database,
                redis,
                storage,
                app,
            },
        };
    }
    async checkDatabaseHealth() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            this.logger.debug(`Database health check passed (${latency}ms)`);
            return {
                status: 'connected',
                latency,
                message: 'Database connection successful',
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            const message = error instanceof Error ? error.message : 'Unknown database error';
            this.logger.error('Database health check failed', {
                error: message,
                latency,
            });
            return {
                status: 'disconnected',
                latency,
                message: `Database error: ${message}`,
            };
        }
    }
    async checkRedisHealth() {
        const startTime = Date.now();
        try {
            const client = this.redis.getClient();
            if (!client) {
                return {
                    status: 'disconnected',
                    latency: 0,
                    message: 'Redis client not initialized',
                };
            }
            await client.ping();
            const latency = Date.now() - startTime;
            this.logger.debug(`Redis health check passed (${latency}ms)`);
            return {
                status: 'connected',
                latency,
                message: 'Redis connection successful',
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            const message = error instanceof Error ? error.message : 'Unknown Redis error';
            this.logger.error('Redis health check failed', {
                error: message,
                latency,
            });
            return {
                status: 'disconnected',
                latency,
                message: `Redis error: ${message}`,
            };
        }
    }
    async checkStorageHealth() {
        const startTime = Date.now();
        try {
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucketName,
                MaxKeys: 1,
            });
            await this.s3Client.send(command);
            const latency = Date.now() - startTime;
            this.logger.debug(`Storage health check passed (${latency}ms)`);
            return {
                status: 'connected',
                latency,
                message: 'S3 storage connection successful',
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            const message = error instanceof Error ? error.message : 'Unknown S3 error';
            this.logger.error('Storage health check failed', {
                error: message,
                latency,
            });
            return {
                status: 'disconnected',
                latency,
                message: `S3 error: ${message}`,
            };
        }
    }
    async checkAppHealth() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        return {
            status: 'online',
            uptime,
            memoryMB,
        };
    }
    async sendExpiringSubscriptionEmails() {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const sixDaysFromNow = new Date();
        sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
        const expiring = await this.prisma.orgSubscription.findMany({
            where: {
                expiresAt: { gte: sixDaysFromNow, lte: sevenDaysFromNow },
                isActive: true,
                plan: { not: 'STARTER' },
            },
            include: {
                user: {
                    include: {
                        identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
                    },
                },
            },
        });
        for (const sub of expiring) {
            const email = sub.user.identities[0]?.email;
            if (email && sub.expiresAt) {
                await this.emailService
                    .sendSubscriptionExpiring({
                    email,
                    userName: sub.user.fullName || sub.user.username || 'there',
                    plan: sub.plan,
                    expiresAt: this.formatDate(sub.expiresAt),
                    renewUrl: 'https://forge.unifesto.app/subscription',
                })
                    .catch((err) => this.logger.error('Failed to send expiring subscription email', err));
            }
        }
        this.logger.log(`Sent expiring subscription emails to ${expiring.length} users`);
    }
    formatDate(date) {
        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    }
    async registerDeviceToken(userId, fcmToken, platform) {
        await this.prisma.adminDevice.upsert({
            where: { fcmToken },
            create: { userId, fcmToken, platform },
            update: { userId, platform },
        });
        this.logger.log('Registered FCM token for user: ' + userId);
        return { message: 'Device token registered' };
    }
    async unregisterDeviceToken(userId, fcmToken) {
        await this.prisma.adminDevice.deleteMany({
            where: { userId, fcmToken },
        });
        return { message: 'Device token unregistered' };
    }
    async sendPushToAdmins(title, body, data) {
        const devices = await this.prisma.adminDevice.findMany({
            include: { user: { include: { roles: { include: { role: true } } } } },
        });
        const adminDevices = devices.filter(d => d.user.roles.some(r => r.role.code === 'ADMIN'));
        if (adminDevices.length === 0)
            return;
        const tokens = adminDevices.map((d) => d.fcmToken);
        const stringData = data
            ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
            : undefined;
        try {
            const messaging = (0, firebase_admin_provider_1.getFirebaseAdmin)().messaging();
            const response = await messaging.sendEachForMulticast({
                tokens,
                notification: { title, body },
                data: stringData,
            });
            this.logger.log(`Admin push sent: ${response.successCount} succeeded, ${response.failureCount} failed`);
            const invalidTokens = [];
            response.responses.forEach((r, i) => {
                if (!r.success &&
                    (r.error?.code === 'messaging/invalid-registration-token' ||
                        r.error?.code === 'messaging/registration-token-not-registered')) {
                    invalidTokens.push(tokens[i]);
                }
            });
            if (invalidTokens.length > 0) {
                await this.prisma.adminDevice.deleteMany({
                    where: { fcmToken: { in: invalidTokens } },
                });
                this.logger.log(`Removed ${invalidTokens.length} stale admin device token(s).`);
            }
        }
        catch (err) {
            this.logger.error(`Failed to send admin push notifications: ${err.message}`);
        }
    }
    async getAnalyticsOverview() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalUsers, newUsers30d, totalSpaces, activeSpaces, pendingSpaceRequests, totalEvents, publishedEvents, totalRegistrations, revenueAgg,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            this.prisma.space.count(),
            this.prisma.space.count({ where: { status: 'ACTIVE' } }),
            this.prisma.spaceRequest.count({ where: { status: 'PENDING' } }),
            this.prisma.event.count(),
            this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.eventRegistration.count(),
            this.prisma.eventRegistration.aggregate({
                _sum: { totalAmount: true },
                where: { paymentStatus: 'PAID' },
            }),
        ]);
        return {
            users: { total: totalUsers, newLast30Days: newUsers30d },
            spaces: {
                total: totalSpaces,
                active: activeSpaces,
                pendingRequests: pendingSpaceRequests,
            },
            events: { total: totalEvents, published: publishedEvents },
            registrations: { total: totalRegistrations },
            revenue: { totalPaid: revenueAgg._sum.totalAmount ?? 0 },
            generatedAt: now.toISOString(),
        };
    }
    async getPm2Logs(params) {
        try {
            const raw = (0, child_process_1.execSync)(`pm2 logs unifesto --lines ${params.lines} --nostream`, { encoding: 'utf8', timeout: 10000 });
            const ansi = /\x1B\[[0-9;]*m|\x1B\[[0-9;]*[A-Za-z]/g;
            const lines = raw.split('\n').filter(Boolean).map(l => l.replace(ansi, ''));
            const filtered = params.search
                ? lines.filter(l => l.toLowerCase().includes(params.search.toLowerCase()))
                : lines;
            return {
                lines: filtered.slice(-params.lines),
                total: filtered.length,
                fetchedAt: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                lines: [],
                total: 0,
                error: 'Failed to fetch PM2 logs',
                fetchedAt: new Date().toISOString(),
            };
        }
    }
    async getAllEvents(params) {
        const { page, limit, status, search } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [events, total] = await Promise.all([
            this.prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    space: { select: { id: true, name: true, slug: true } },
                    creator: { select: { id: true, fullName: true, username: true } },
                    _count: { select: { registrations: true } },
                },
            }),
            this.prisma.event.count({ where }),
        ]);
        return {
            events,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        storage_service_1.StorageService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map