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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const dto_1 = require("../auth/dto");
const storage_service_1 = require("../storage/storage.service");
let UsersService = UsersService_1 = class UsersService {
    prisma;
    configService;
    storageService;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma, configService, storageService) {
        this.prisma = prisma;
        this.configService = configService;
        this.storageService = storageService;
    }
    async getAllUsers(params) {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { mobileNumber: { contains: search } },
                    {
                        identities: {
                            some: {
                                email: { contains: search, mode: 'insensitive' },
                            },
                        },
                    },
                ],
            }
            : {};
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    identities: {
                        select: {
                            id: true,
                            provider: true,
                            email: true,
                            emailVerified: true,
                            isPrimary: true,
                        },
                    },
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        const transformedUsers = users.map((user) => ({
            id: user.id,
            mobileNumber: user.mobileNumber,
            mobileVerified: user.mobileVerified,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            linkedinUrl: user.linkedinUrl,
            instagramUrl: user.instagramUrl,
            githubUrl: user.githubUrl,
            websiteUrl: user.websiteUrl,
            isOnboarded: user.isOnboarded,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            email: user.identities.find((i) => i.email)?.email || null,
            emailVerified: user.identities.find((i) => i.email)?.emailVerified || false,
            roles: user.roles.map((ur) => ur.role.code),
            identitiesCount: user.identities.length,
        }));
        return {
            users: transformedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getUserByIdAdmin(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                identities: {
                    select: {
                        id: true,
                        provider: true,
                        email: true,
                        emailVerified: true,
                        isPrimary: true,
                        createdAt: true,
                    },
                },
                roles: {
                    include: {
                        role: true,
                        assignedByUser: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            user: {
                id: user.id,
                mobileNumber: user.mobileNumber,
                mobileVerified: user.mobileVerified,
                username: user.username,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                linkedinUrl: user.linkedinUrl,
                instagramUrl: user.instagramUrl,
                githubUrl: user.githubUrl,
                websiteUrl: user.websiteUrl,
                isOnboarded: user.isOnboarded,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                email: user.identities.find((i) => i.email)?.email || null,
                emailVerified: user.identities.find((i) => i.email)?.emailVerified || false,
                roles: user.roles.map((ur) => ({
                    id: ur.id,
                    code: ur.role.code,
                    name: ur.role.name,
                    scope: ur.role.scope,
                    spaceId: ur.spaceId,
                    assignedBy: ur.assignedByUser,
                    assignedAt: ur.createdAt,
                })),
                identities: user.identities,
            },
        };
    }
    async updateUserByIdAdmin(userId, dto) {
        if (dto.username) {
            const isAvailable = await this.isUsernameAvailable(dto.username, userId);
            if (!isAvailable) {
                throw new common_1.ConflictException('Username is already taken');
            }
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                username: dto.username,
                fullName: dto.fullName,
                bio: dto.bio,
                linkedinUrl: dto.linkedinUrl,
                instagramUrl: dto.instagramUrl,
                githubUrl: dto.githubUrl,
                websiteUrl: dto.websiteUrl,
            },
            include: {
                identities: {
                    select: {
                        id: true,
                        provider: true,
                        email: true,
                        emailVerified: true,
                        isPrimary: true,
                    },
                },
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        return {
            user: {
                id: user.id,
                mobileNumber: user.mobileNumber,
                mobileVerified: user.mobileVerified,
                username: user.username,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                linkedinUrl: user.linkedinUrl,
                instagramUrl: user.instagramUrl,
                githubUrl: user.githubUrl,
                websiteUrl: user.websiteUrl,
                isOnboarded: user.isOnboarded,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                email: user.identities.find((i) => i.email)?.email || null,
                emailVerified: user.identities.find((i) => i.email)?.emailVerified || false,
                roles: user.roles.map((ur) => ur.role.code),
            },
            message: 'User updated successfully',
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: {
                        role: { select: { code: true, name: true } },
                    },
                },
                referredBy: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return dto_1.UserProfileDto.fromUser(user, user.roles);
    }
    async updateMe(userId, dto) {
        if (dto.username) {
            const isAvailable = await this.isUsernameAvailable(dto.username, userId);
            if (!isAvailable) {
                throw new common_1.ConflictException('Username is already taken');
            }
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                username: dto.username,
                fullName: dto.fullName,
                bio: dto.bio,
                gender: dto.gender,
                linkedinUrl: dto.linkedinUrl,
                instagramUrl: dto.instagramUrl,
                githubUrl: dto.githubUrl,
                websiteUrl: dto.websiteUrl,
            },
        });
        return dto_1.UserProfileDto.fromUser(user, user.roles);
    }
    async completeOnboarding(userId, data) {
        if (data?.username) {
            const available = await this.isUsernameAvailable(data.username, userId);
            if (!available)
                throw new common_1.ConflictException('Username is already taken');
        }
        if (data?.referralCode) {
            const referrer = await this.prisma.user.findFirst({ where: { referralCode: data.referralCode } });
            if (referrer && referrer.id !== userId) {
                this.prisma.wallet.updateMany({ where: { userId: referrer.id }, data: { balance: { increment: 50 } } }).catch(() => { });
            }
        }
        const updateData = { isOnboarded: true };
        if (data?.username)
            updateData.username = data.username;
        if (data?.fullName)
            updateData.fullName = data.fullName;
        if (data?.city)
            updateData.city = data.city;
        const user = await this.prisma.user.update({ where: { id: userId }, data: updateData });
        return dto_1.UserProfileDto.fromUser(user, user.roles);
    }
    async getUserByUsername(username) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return dto_1.UserProfileDto.fromUser(user, user.roles);
    }
    async checkUsernameAvailability(username) {
        const available = await this.isUsernameAvailable(username);
        return { available };
    }
    async isUsernameAvailable(username, excludeUserId) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            return true;
        }
        if (excludeUserId && user.id === excludeUserId) {
            return true;
        }
        return false;
    }
    async uploadAvatar(userId, file) {
        this.logger.log(`Uploading avatar for user ${userId}`);
        const avatarUrl = await this.storageService.uploadFile(file, 'avatars/', userId);
        this.logger.log(`Avatar uploaded successfully: ${avatarUrl}`);
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        return { avatarUrl };
    }
    async getUserIdentities(userId) {
        const identities = await this.prisma.userIdentity.findMany({
            where: { userId },
            select: {
                id: true,
                provider: true,
                email: true,
                emailVerified: true,
                isPrimary: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        return identities;
    }
    async setPrimaryIdentity(userId, identityId) {
        const identity = await this.prisma.userIdentity.findUnique({
            where: { id: identityId },
        });
        if (!identity || identity.userId !== userId) {
            throw new common_1.NotFoundException('Identity not found');
        }
        if (!identity.email) {
            throw new common_1.BadRequestException('Only email identities can be set as primary');
        }
        await this.prisma.$transaction([
            this.prisma.userIdentity.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false },
            }),
            this.prisma.userIdentity.update({
                where: { id: identityId },
                data: { isPrimary: true },
            }),
        ]);
        return { message: 'Primary email updated' };
    }
    async removeIdentity(userId, identityId) {
        const identity = await this.prisma.userIdentity.findUnique({
            where: { id: identityId },
        });
        if (!identity || identity.userId !== userId) {
            throw new common_1.NotFoundException('Identity not found');
        }
        const count = await this.prisma.userIdentity.count({ where: { userId } });
        if (count <= 1) {
            throw new common_1.BadRequestException('Cannot remove your only linked account');
        }
        if (identity.isPrimary) {
            const next = await this.prisma.userIdentity.findFirst({
                where: { userId, id: { not: identityId }, email: { not: null } },
                orderBy: { createdAt: 'asc' },
            });
            if (next) {
                await this.prisma.userIdentity.update({
                    where: { id: next.id },
                    data: { isPrimary: true },
                });
            }
        }
        await this.prisma.userIdentity.delete({ where: { id: identityId } });
        return { message: 'Account unlinked successfully' };
    }
    async getUserSpaces(userId) {
        const userRoles = await this.prisma.userRole.findMany({
            where: {
                userId,
                space: {
                    status: 'ACTIVE',
                },
            },
            include: {
                space: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                            },
                        },
                        _count: {
                            select: {
                                userRoles: true,
                            },
                        },
                    },
                },
                role: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return userRoles
            .filter((ur) => ur.space !== null)
            .map((ur) => ({
            id: ur.space.id,
            name: ur.space.name,
            slug: ur.space.slug,
            description: ur.space.description,
            logo_url: ur.space.logoUrl,
            banner_url: ur.space.bannerUrl,
            city: ur.space.city,
            state: ur.space.state,
            country: ur.space.country,
            visibility: ur.space.visibility,
            status: ur.space.status,
            member_count: ur.space._count.userRoles,
            event_count: 0,
            creator: ur.space.creator,
            userRole: {
                id: ur.role.id,
                code: ur.role.code,
                name: ur.role.name,
            },
            createdAt: ur.space.createdAt,
            updatedAt: ur.space.updatedAt,
        }));
    }
    async deleteAccount(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.delete({ where: { id: userId } });
        return { message: 'Account deleted successfully' };
    }
    async getNotificationSettings(userId) {
        const settings = await this.prisma.notificationSettings.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
        return this.toNotificationSettingsDto(settings);
    }
    async updateNotificationSettings(userId, dto) {
        const settings = await this.prisma.notificationSettings.upsert({
            where: { userId },
            update: { ...dto },
            create: { userId, ...dto },
        });
        return this.toNotificationSettingsDto(settings);
    }
    toNotificationSettingsDto(settings) {
        return {
            pushEnabled: settings.pushEnabled,
            emailEnabled: settings.emailEnabled,
            eventReminders: settings.eventReminders,
            newEvents: settings.newEvents,
            referralUpdates: settings.referralUpdates,
            promotions: settings.promotions,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        storage_service_1.StorageService])
], UsersService);
//# sourceMappingURL=users.service.js.map