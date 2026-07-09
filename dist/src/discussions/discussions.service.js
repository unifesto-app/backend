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
var DiscussionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscussionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DiscussionsService = DiscussionsService_1 = class DiscussionsService {
    prisma;
    logger = new common_1.Logger(DiscussionsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDiscussionsBySpace(spaceId, params) {
        const { page = 1, limit = 20, pinned } = params;
        const skip = (page - 1) * limit;
        const where = {
            spaceId,
            isDeleted: false,
        };
        if (pinned !== undefined) {
            where.isPinned = pinned;
        }
        const [discussions, total] = await Promise.all([
            this.prisma.discussion.findMany({
                where,
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            id: true,
                            fullName: true,
                            username: true,
                            avatarUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            replies: {
                                where: { isDeleted: false },
                            },
                        },
                    },
                },
                orderBy: [{ isPinned: 'desc' }, { lastActivityAt: 'desc' }],
            }),
            this.prisma.discussion.count({ where }),
        ]);
        return {
            discussions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getDiscussionById(id) {
        const discussion = await this.prisma.discussion.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                space: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                replies: {
                    where: { isDeleted: false },
                    include: {
                        author: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!discussion || discussion.isDeleted) {
            throw new common_1.NotFoundException('Discussion not found');
        }
        await this.prisma.discussion.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
        return discussion;
    }
    async createDiscussion(dto, authorId) {
        const space = await this.prisma.space.findUnique({
            where: { id: dto.spaceId },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        const discussion = await this.prisma.discussion.create({
            data: {
                title: dto.title,
                content: dto.content,
                spaceId: dto.spaceId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        return discussion;
    }
    async updateDiscussion(id, dto, userId) {
        const discussion = await this.prisma.discussion.findUnique({
            where: { id },
        });
        if (!discussion || discussion.isDeleted) {
            throw new common_1.NotFoundException('Discussion not found');
        }
        if ((dto.title || dto.content) &&
            discussion.authorId !== userId) {
            throw new common_1.ForbiddenException('Only the author can update discussion content');
        }
        const updatedDiscussion = await this.prisma.discussion.update({
            where: { id },
            data: {
                ...dto,
                updatedAt: new Date(),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        return updatedDiscussion;
    }
    async deleteDiscussion(id, userId) {
        const discussion = await this.prisma.discussion.findUnique({
            where: { id },
        });
        if (!discussion || discussion.isDeleted) {
            throw new common_1.NotFoundException('Discussion not found');
        }
        if (discussion.authorId !== userId) {
            throw new common_1.ForbiddenException('Only the author can delete this discussion');
        }
        await this.prisma.discussion.update({
            where: { id },
            data: { isDeleted: true },
        });
        return { message: 'Discussion deleted successfully' };
    }
    async togglePin(id, isPinned) {
        const discussion = await this.prisma.discussion.findUnique({
            where: { id },
        });
        if (!discussion || discussion.isDeleted) {
            throw new common_1.NotFoundException('Discussion not found');
        }
        const updated = await this.prisma.discussion.update({
            where: { id },
            data: { isPinned },
        });
        return updated;
    }
    async toggleLock(id, isLocked) {
        const discussion = await this.prisma.discussion.findUnique({
            where: { id },
        });
        if (!discussion || discussion.isDeleted) {
            throw new common_1.NotFoundException('Discussion not found');
        }
        const updated = await this.prisma.discussion.update({
            where: { id },
            data: { isLocked },
        });
        return updated;
    }
    async createReply(dto, authorId) {
        const discussion = await this.prisma.discussion.findUnique({
            where: { id: dto.discussionId },
        });
        if (!discussion || discussion.isDeleted) {
            throw new common_1.NotFoundException('Discussion not found');
        }
        if (discussion.isLocked) {
            throw new common_1.ForbiddenException('Discussion is locked');
        }
        const reply = await this.prisma.discussionReply.create({
            data: {
                content: dto.content,
                discussionId: dto.discussionId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        await this.prisma.discussion.update({
            where: { id: dto.discussionId },
            data: {
                replyCount: { increment: 1 },
                lastActivityAt: new Date(),
            },
        });
        return reply;
    }
    async deleteReply(id, userId) {
        const reply = await this.prisma.discussionReply.findUnique({
            where: { id },
            include: { discussion: true },
        });
        if (!reply || reply.isDeleted) {
            throw new common_1.NotFoundException('Reply not found');
        }
        if (reply.authorId !== userId) {
            throw new common_1.ForbiddenException('Only the author can delete this reply');
        }
        await this.prisma.discussionReply.update({
            where: { id },
            data: { isDeleted: true },
        });
        await this.prisma.discussion.update({
            where: { id: reply.discussionId },
            data: {
                replyCount: { decrement: 1 },
            },
        });
        return { message: 'Reply deleted successfully' };
    }
};
exports.DiscussionsService = DiscussionsService;
exports.DiscussionsService = DiscussionsService = DiscussionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiscussionsService);
//# sourceMappingURL=discussions.service.js.map