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
var SpacesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpacesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const email_service_1 = require("../email/email.service");
const config_1 = require("@nestjs/config");
const sub_space_request_dto_1 = require("./dto/sub-space-request.dto");
const client_1 = require("@prisma/client");
let SpacesService = SpacesService_1 = class SpacesService {
    prisma;
    storageService;
    emailService;
    configService;
    logger = new common_1.Logger(SpacesService_1.name);
    constructor(prisma, storageService, emailService, configService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.emailService = emailService;
        this.configService = configService;
    }
    async createSpace(dto, createdBy) {
        const existing = await this.prisma.space.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Space slug is already taken');
        }
        const space = await this.prisma.space.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                websiteUrl: dto.websiteUrl,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                tags: dto.tags || [],
                visibility: dto.visibility || client_1.SpaceVisibility.PUBLIC,
                coOrganiserLimit: dto.coOrganiserLimit || 5,
                createdBy,
                status: client_1.SpaceStatus.PENDING,
                submittedAt: new Date(),
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        mobileNumber: true,
                    },
                },
            },
        });
        const adminEmail = this.configService.get('ADMIN_EMAIL');
        if (adminEmail) {
            this.emailService.sendNewSpaceSubmittedToAdmin({
                adminEmail,
                spaceName: space.name,
                organizerName: space.creator.fullName || space.creator.username || 'Unknown',
                organizerMobile: space.creator.mobileNumber,
                spaceDescription: space.description || undefined,
                submittedAt: space.submittedAt?.toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                }) || new Date().toLocaleString(),
            }).catch(err => this.logger.error('Failed to send new space notification email', err));
        }
        return space;
    }
    async getAllSpaces(params) {
        const { page = 1, limit = 10, status, visibility, search, parentId } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (visibility) {
            where.visibility = visibility;
        }
        if (parentId) {
            where.parentSpaceId = parentId;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [spaces, total] = await Promise.all([
            this.prisma.space.findMany({
                where,
                skip,
                take: limit,
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
                            discussions: true,
                            events: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.space.count({ where }),
        ]);
        const publicSpaces = spaces.map((space) => {
            const { approvedBy, rejectionReason, requestedParentId, parentRequestPending, plan, planActivatedAt, planExpiresAt, coOrganiserLimit, ...publicSpace } = space;
            return publicSpace;
        });
        return {
            spaces: publicSpaces,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getSpaceById(id, userId) {
        const space = await this.prisma.space.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                parentSpace: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        type: true,
                    },
                },
                userRoles: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                        role: true,
                    },
                },
                _count: {
                    select: {
                        discussions: true,
                        userRoles: true,
                        events: true,
                    },
                },
            },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        const userRole = userId
            ? (space.userRoles.find((ur) => ur.userId === userId) || null)
            : null;
        const organiserRoleCodes = [
            client_1.RoleCode.ORGANISER,
            client_1.RoleCode.CO_ORGANISER,
        ];
        const organisers = space.userRoles
            .filter((ur) => organiserRoleCodes.includes(ur.role?.code))
            .map((ur) => ({
            id: ur.id,
            user: ur.user,
            role: ur.role,
            createdAt: ur.createdAt,
        }));
        const { userRoles, approvedBy, rejectionReason, requestedParentId, parentRequestPending, plan, planActivatedAt, planExpiresAt, coOrganiserLimit, ...publicSpace } = space;
        return { ...publicSpace, userRole, organisers };
    }
    async getSpaceBySlug(slug) {
        const space = await this.prisma.space.findUnique({
            where: { slug },
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
                        discussions: true,
                        events: true,
                    },
                },
            },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        const { approvedBy, rejectionReason, requestedParentId, parentRequestPending, plan, planActivatedAt, planExpiresAt, coOrganiserLimit, ...publicSpace } = space;
        return publicSpace;
    }
    async updateSpace(id, dto) {
        const space = await this.prisma.space.findUnique({ where: { id } });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        if (dto.type === 'SUPER' && space.parentSpaceId) {
            throw new common_1.BadRequestException('A child space cannot be converted to SUPER. Remove the parent space relationship first.');
        }
        if (dto.parentSpaceId) {
            if (space.type === 'SUPER') {
                throw new common_1.BadRequestException('A SUPER space cannot be assigned a parent space.');
            }
            const parentSpace = await this.prisma.space.findUnique({ where: { id: dto.parentSpaceId } });
            if (!parentSpace)
                throw new common_1.NotFoundException('Parent space not found');
            if (parentSpace.type !== 'SUPER') {
                throw new common_1.BadRequestException('Parent space must be a SUPER space.');
            }
        }
        if (dto.slug && dto.slug !== space.slug) {
            const existing = await this.prisma.space.findUnique({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new common_1.ConflictException('Space slug is already taken');
            }
        }
        const updatedSpace = await this.prisma.space.update({
            where: { id },
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                websiteUrl: dto.websiteUrl,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                tags: dto.tags,
                visibility: dto.visibility,
                coOrganiserLimit: dto.coOrganiserLimit,
                type: dto.type,
                ...(dto.parentSpaceId !== undefined ? { parentSpaceId: dto.parentSpaceId } : {}),
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
            },
        });
        return updatedSpace;
    }
    async updateSpaceStatus(id, dto, approvedBy) {
        const space = await this.prisma.space.findUnique({
            where: { id },
            include: {
                creator: {
                    include: {
                        identities: true,
                    },
                },
            },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        const updateData = {
            status: dto.status,
        };
        if (dto.status === client_1.SpaceStatus.APPROVED) {
            updateData.approvedAt = new Date();
            updateData.approvedBy = approvedBy;
            updateData.rejectedAt = null;
            updateData.rejectionReason = null;
        }
        else if (dto.status === client_1.SpaceStatus.REJECTED) {
            updateData.rejectedAt = new Date();
            updateData.rejectionReason = dto.rejectionReason;
            updateData.approvedAt = null;
            updateData.approvedBy = null;
        }
        const updatedSpace = await this.prisma.space.update({
            where: { id },
            data: updateData,
        });
        const organizerEmail = space.creator.identities.find(i => i.email)?.email;
        if (organizerEmail) {
            if (dto.status === client_1.SpaceStatus.APPROVED) {
                this.emailService.sendSpaceApproved({
                    email: organizerEmail,
                    organizerName: space.creator.fullName || space.creator.username || 'there',
                    spaceName: space.name,
                    spaceSlug: space.slug,
                }).catch(err => this.logger.error('Failed to send space approved email', err));
            }
            else if (dto.status === client_1.SpaceStatus.REJECTED && dto.rejectionReason) {
                this.emailService.sendSpaceRejected({
                    email: organizerEmail,
                    organizerName: space.creator.fullName || space.creator.username || 'there',
                    spaceName: space.name,
                    rejectionReason: dto.rejectionReason,
                }).catch(err => this.logger.error('Failed to send space rejected email', err));
            }
        }
        return updatedSpace;
    }
    async deleteSpace(id) {
        const space = await this.prisma.space.findUnique({ where: { id } });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        await this.prisma.space.delete({ where: { id } });
        return { message: 'Space deleted successfully' };
    }
    async uploadLogo(id, file) {
        const space = await this.prisma.space.findUnique({ where: { id } });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        const logoUrl = await this.storageService.uploadFile(file, 'space-logos/', id);
        await this.prisma.space.update({
            where: { id },
            data: { logoUrl },
        });
        return { logoUrl };
    }
    async uploadBanner(id, file) {
        const space = await this.prisma.space.findUnique({ where: { id } });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        const bannerUrl = await this.storageService.uploadFile(file, 'space-banners/', id);
        await this.prisma.space.update({
            where: { id },
            data: { bannerUrl },
        });
        return { bannerUrl };
    }
    async getSpaceMembers(spaceId) {
        const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        const members = await this.prisma.userRole.findMany({
            where: { spaceId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                role: true,
            },
            orderBy: [{ role: { code: 'asc' } }, { createdAt: 'asc' }],
        });
        return members;
    }
    async joinSpace(spaceId, userId) {
        const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        if (space.status !== client_1.SpaceStatus.ACTIVE) {
            throw new common_1.BadRequestException('Space is not active');
        }
        const existingMember = await this.prisma.userRole.findFirst({
            where: {
                userId,
                spaceId,
            },
        });
        if (existingMember) {
            throw new common_1.ConflictException('You are already a member of this space');
        }
        const memberRole = await this.prisma.role.findFirst({
            where: {
                code: 'MEMBER',
                scope: 'SPACE',
            },
        });
        if (!memberRole) {
            throw new common_1.NotFoundException('Member role not found');
        }
        const userRole = await this.prisma.userRole.create({
            data: {
                userId,
                roleId: memberRole.id,
                spaceId,
            },
            include: {
                role: true,
                space: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
        return {
            message: 'Successfully joined the space',
            userRole,
        };
    }
    async leaveSpace(spaceId, userId) {
        const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
        });
        if (!space) {
            throw new common_1.NotFoundException('Space not found');
        }
        this.logger.log(`parentSpace: ${JSON.stringify(space.parentSpace)}`);
        const membership = await this.prisma.userRole.findFirst({
            where: {
                userId,
                spaceId,
            },
            include: {
                role: true,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('You are not a member of this space');
        }
        if (space.createdBy === userId) {
            throw new common_1.BadRequestException('Space creator cannot leave the space');
        }
        await this.prisma.userRole.delete({
            where: { id: membership.id },
        });
        return {
            message: 'Successfully left the space',
        };
    }
    async createSpaceRequest(userId, dto) {
        const existing = await this.prisma.spaceRequest.findFirst({
            where: { userId, status: 'PENDING' },
        });
        if (existing) {
            throw new common_1.BadRequestException('You already have a pending space request');
        }
        const request = await this.prisma.spaceRequest.create({
            data: {
                userId,
                name: dto.name,
                description: dto.description,
                type: dto.type || 'REGULAR',
                visibility: dto.visibility || 'PUBLIC',
                city: dto.city,
                state: dto.state,
                country: 'India',
                tags: dto.tags || [],
                websiteUrl: dto.websiteUrl,
                status: 'PENDING',
            },
        });
        return request;
    }
    async getMySpaceRequests(userId) {
        return this.prisma.spaceRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getAllSpaceRequests(status) {
        return this.prisma.spaceRequest.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        mobileNumber: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
    async approveSpaceRequest(requestId, adminId) {
        const req = await this.prisma.spaceRequest.findUnique({
            where: { id: requestId },
        });
        if (!req) {
            throw new common_1.NotFoundException('Space request not found');
        }
        if (req.status !== 'PENDING') {
            throw new common_1.BadRequestException('Request has already been reviewed');
        }
        const baseSlug = req.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug || 'space'}-${Date.now().toString(36)}`;
        return this.prisma.$transaction(async (tx) => {
            const space = await tx.space.create({
                data: {
                    name: req.name,
                    slug,
                    description: req.description,
                    type: req.type,
                    visibility: req.visibility,
                    city: req.city,
                    state: req.state,
                    country: req.country,
                    tags: req.tags ?? [],
                    websiteUrl: req.websiteUrl,
                    status: client_1.SpaceStatus.ACTIVE,
                    submittedAt: req.createdAt,
                    approvedAt: new Date(),
                    approvedBy: adminId,
                    createdBy: req.userId,
                },
            });
            const organiserRole = await tx.role.findUnique({
                where: { code: 'ORGANISER' },
            });
            if (organiserRole) {
                await tx.userRole.create({
                    data: {
                        userId: req.userId,
                        roleId: organiserRole.id,
                        spaceId: space.id,
                        assignedBy: adminId,
                    },
                });
            }
            await tx.spaceRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED', reviewedBy: adminId },
            });
            return space;
        });
    }
    async rejectSpaceRequest(requestId, adminId, reviewNote) {
        const req = await this.prisma.spaceRequest.findUnique({
            where: { id: requestId },
        });
        if (!req) {
            throw new common_1.NotFoundException('Space request not found');
        }
        if (req.status !== 'PENDING') {
            throw new common_1.BadRequestException('Request has already been reviewed');
        }
        return this.prisma.spaceRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', reviewedBy: adminId, reviewNote },
        });
    }
    async createSpaceStatusRequest(userId, dto) {
        const space = await this.prisma.space.findUnique({
            where: { id: dto.spaceId },
        });
        if (!space)
            throw new common_1.NotFoundException('Space not found');
        if (space.createdBy !== userId)
            throw new common_1.ForbiddenException('Not your space');
        const existing = await this.prisma.spaceStatusRequest.findFirst({
            where: { spaceId: dto.spaceId, status: 'PENDING' },
        });
        if (existing)
            throw new common_1.ConflictException('A pending status request already exists for this space');
        const allowedTransitions = {
            ACTIVE: ['INACTIVE'],
            INACTIVE: ['ACTIVE'],
            SUSPENDED: ['ACTIVE'],
            ARCHIVED: ['ACTIVE'],
        };
        const allowed = allowedTransitions[space.status] || [];
        if (!allowed.includes(dto.requestedStatus)) {
            throw new common_1.BadRequestException(`Cannot request ${dto.requestedStatus} from current status ${space.status}`);
        }
        return this.prisma.spaceStatusRequest.create({
            data: {
                spaceId: dto.spaceId,
                requestedBy: userId,
                currentStatus: space.status,
                requestedStatus: dto.requestedStatus,
                reason: dto.reason,
                status: 'PENDING',
            },
            include: {
                space: { select: { id: true, name: true, slug: true } },
                user: { select: { id: true, fullName: true, username: true } },
            },
        });
    }
    async getMySpaceStatusRequests(userId, spaceId) {
        return this.prisma.spaceStatusRequest.findMany({
            where: {
                requestedBy: userId,
                ...(spaceId ? { spaceId } : {}),
            },
            include: {
                space: { select: { id: true, name: true, slug: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getAllSpaceStatusRequests(status, page = 1, limit = 20) {
        const where = status ? { status } : {};
        const [requests, total] = await Promise.all([
            this.prisma.spaceStatusRequest.findMany({
                where,
                include: {
                    space: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            status: true,
                            logoUrl: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            username: true,
                            mobileNumber: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.spaceStatusRequest.count({ where }),
        ]);
        return {
            requests,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async reviewSpaceStatusRequest(requestId, adminId, dto) {
        const req = await this.prisma.spaceStatusRequest.findUnique({
            where: { id: requestId },
            include: {
                space: true,
                user: {
                    include: {
                        identities: { where: { email: { not: null } }, take: 1 },
                    },
                },
            },
        });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.status !== 'PENDING')
            throw new common_1.BadRequestException('Request already reviewed');
        const updated = await this.prisma.spaceStatusRequest.update({
            where: { id: requestId },
            data: {
                status: dto.status,
                reviewNote: dto.reviewNote || null,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });
        if (dto.status === 'APPROVED') {
            await this.prisma.space.update({
                where: { id: req.spaceId },
                data: { status: req.requestedStatus },
            });
        }
        const email = req.user.identities[0]?.email;
        if (email) {
            if (dto.status === 'APPROVED') {
                this.emailService.sendRawEmail(email, `Space status updated to ${req.requestedStatus} — Unifesto`, `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#16a34a">Status Change Approved ✓</h2>
            <p>Hi ${req.user.fullName || req.user.username || 'there'},</p>
            <p>Your request to change <strong>${req.space.name}</strong>'s status to <strong>${req.requestedStatus}</strong> has been approved.</p>
            ${dto.reviewNote ? `<p><strong>Note from admin:</strong> ${dto.reviewNote}</p>` : ''}
            <a href="https://forge.unifesto.app/dashboard/spaces/${req.spaceId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px">View Space</a>
          </div>`).catch(() => { });
            }
            else {
                this.emailService.sendRawEmail(email, `Space status change request rejected — Unifesto`, `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#dc2626">Status Change Request Rejected</h2>
            <p>Hi ${req.user.fullName || req.user.username || 'there'},</p>
            <p>Your request to change <strong>${req.space.name}</strong>'s status to <strong>${req.requestedStatus}</strong> has been rejected.</p>
            ${dto.reviewNote ? `<p><strong>Reason:</strong> ${dto.reviewNote}</p>` : ''}
            <a href="https://forge.unifesto.app/dashboard/spaces/${req.spaceId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px">View Space</a>
          </div>`).catch(() => { });
            }
        }
        return updated;
    }
    async createSubSpaceRequest(userId, dto) {
        const { requestType, subSpaceId, targetSpaceId, reason } = dto;
        const targetSpace = await this.prisma.space.findUnique({
            where: { id: targetSpaceId },
        });
        if (!targetSpace) {
            throw new common_1.NotFoundException('Target space not found');
        }
        if (requestType !== sub_space_request_dto_1.SubSpaceRequestType.CONVERT_TO_SUPER) {
            if (!subSpaceId) {
                throw new common_1.BadRequestException('subSpaceId is required for this request type');
            }
            const subSpace = await this.prisma.space.findUnique({
                where: { id: subSpaceId },
            });
            if (!subSpace) {
                throw new common_1.NotFoundException('Sub-space not found');
            }
            if (subSpaceId === targetSpaceId) {
                throw new common_1.BadRequestException('A space cannot be made a sub-space of itself');
            }
            if (subSpace.parentSpaceId) {
                throw new common_1.ConflictException('This space already belongs to a super space');
            }
        }
        if (requestType === sub_space_request_dto_1.SubSpaceRequestType.JOIN_SUPER) {
            if (targetSpace.type !== 'SUPER') {
                throw new common_1.BadRequestException('Target space is not a SUPER space; use CONVERT_AND_JOIN instead');
            }
        }
        else if (requestType === sub_space_request_dto_1.SubSpaceRequestType.CONVERT_AND_JOIN) {
            if (targetSpace.type === 'SUPER') {
                throw new common_1.BadRequestException('Target space is already a SUPER space; use JOIN_SUPER instead');
            }
        }
        else if (requestType === sub_space_request_dto_1.SubSpaceRequestType.CONVERT_TO_SUPER) {
            if (targetSpace.type === 'SUPER') {
                throw new common_1.BadRequestException('Target space is already a SUPER space');
            }
        }
        const existing = await this.prisma.subSpaceRequest.findFirst({
            where: {
                targetSpaceId,
                subSpaceId: subSpaceId ?? null,
                requestType,
                status: 'PENDING',
            },
        });
        if (existing) {
            throw new common_1.ConflictException('A pending request already exists for this combination');
        }
        return this.prisma.subSpaceRequest.create({
            data: {
                requestType,
                subSpaceId: subSpaceId ?? null,
                targetSpaceId,
                requestedBy: userId,
                reason,
            },
            include: {
                subSpace: { select: { id: true, name: true, slug: true } },
                targetSpace: { select: { id: true, name: true, slug: true } },
            },
        });
    }
    async getMySubSpaceRequests(userId) {
        return this.prisma.subSpaceRequest.findMany({
            where: { requestedBy: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                subSpace: { select: { id: true, name: true, slug: true } },
                targetSpace: { select: { id: true, name: true, slug: true } },
            },
        });
    }
    async getAllSubSpaceRequests(status, page = 1, limit = 20) {
        const where = status ? { status } : {};
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.subSpaceRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    subSpace: { select: { id: true, name: true, slug: true, type: true, logoUrl: true } },
                    targetSpace: { select: { id: true, name: true, slug: true, type: true, logoUrl: true } },
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            username: true,
                            mobileNumber: true,
                            identities: { select: { email: true } },
                        },
                    },
                },
            }),
            this.prisma.subSpaceRequest.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async reviewSubSpaceRequest(id, reviewerId, dto) {
        const request = await this.prisma.subSpaceRequest.findUnique({
            where: { id },
            include: {
                subSpace: true,
                targetSpace: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        identities: { select: { email: true } },
                    },
                },
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Sub-space request not found');
        }
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException('This request has already been reviewed');
        }
        const approved = dto.status === 'APPROVED';
        const updated = await this.prisma.$transaction(async (tx) => {
            const reviewed = await tx.subSpaceRequest.update({
                where: { id },
                data: {
                    status: dto.status,
                    reviewNote: dto.reviewNote ?? null,
                    reviewedBy: reviewerId,
                    reviewedAt: new Date(),
                },
            });
            if (approved) {
                if (request.requestType === sub_space_request_dto_1.SubSpaceRequestType.CONVERT_AND_JOIN ||
                    request.requestType === sub_space_request_dto_1.SubSpaceRequestType.CONVERT_TO_SUPER) {
                    await tx.space.update({
                        where: { id: request.targetSpaceId },
                        data: { type: 'SUPER' },
                    });
                }
                if (request.requestType !== sub_space_request_dto_1.SubSpaceRequestType.CONVERT_TO_SUPER &&
                    request.subSpaceId) {
                    await tx.space.update({
                        where: { id: request.subSpaceId },
                        data: { parentSpaceId: request.targetSpaceId },
                    });
                }
            }
            return reviewed;
        });
        const email = request.user.identities[0]?.email;
        if (email) {
            const name = request.user.fullName || request.user.username || 'there';
            if (approved) {
                this.emailService
                    .sendRawEmail(email, `Your sub-space request was approved — Unifesto`, `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#16a34a">Sub-Space Request Approved</h2>
              <p>Hi ${name},</p>
              <p>Your request related to <strong>${request.targetSpace.name}</strong> has been approved.</p>
              ${dto.reviewNote ? `<p><strong>Note:</strong> ${dto.reviewNote}</p>` : ''}
            </div>`)
                    .catch(() => { });
            }
            else {
                this.emailService
                    .sendRawEmail(email, `Your sub-space request was rejected — Unifesto`, `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#dc2626">Sub-Space Request Rejected</h2>
              <p>Hi ${name},</p>
              <p>Your request related to <strong>${request.targetSpace.name}</strong> has been rejected.</p>
              ${dto.reviewNote ? `<p><strong>Reason:</strong> ${dto.reviewNote}</p>` : ''}
            </div>`)
                    .catch(() => { });
            }
        }
        return updated;
    }
};
exports.SpacesService = SpacesService;
exports.SpacesService = SpacesService = SpacesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        email_service_1.EmailService,
        config_1.ConfigService])
], SpacesService);
//# sourceMappingURL=spaces.service.js.map