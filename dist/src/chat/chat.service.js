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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const chat_encryption_service_1 = require("./chat-encryption.service");
const moderation_service_1 = require("./moderation/moderation.service");
const client_1 = require("@prisma/client");
let ChatService = class ChatService {
    prisma;
    encryption;
    moderation;
    storage;
    constructor(prisma, encryption, moderation, storage) {
        this.prisma = prisma;
        this.encryption = encryption;
        this.moderation = moderation;
        this.storage = storage;
    }
    async createGroupForEvent(eventId, spaceId, organiserIds) {
        const group = await this.prisma.chatGroup.create({
            data: {
                eventId,
                spaceId,
                participants: {
                    create: organiserIds.map((userId) => ({
                        userId,
                        role: client_1.ChatParticipantRole.ORGANISER,
                    })),
                },
            },
        });
        return group;
    }
    async addParticipant(eventId, userId) {
        const group = await this.prisma.chatGroup.findUnique({
            where: { eventId },
        });
        if (!group)
            return null;
        return this.prisma.chatParticipant.upsert({
            where: { chatGroupId_userId: { chatGroupId: group.id, userId } },
            update: { leftAt: null },
            create: {
                chatGroupId: group.id,
                userId,
                role: client_1.ChatParticipantRole.ATTENDEE,
            },
        });
    }
    async removeParticipant(eventId, userId) {
        const group = await this.prisma.chatGroup.findUnique({
            where: { eventId },
        });
        if (!group)
            return null;
        return this.prisma.chatParticipant.updateMany({
            where: { chatGroupId: group.id, userId },
            data: { leftAt: new Date() },
        });
    }
    async archiveGroup(eventId) {
        return this.prisma.chatGroup.updateMany({
            where: { eventId },
            data: { status: 'ARCHIVED', archivedAt: new Date() },
        });
    }
    async assertMember(chatGroupId, userId) {
        const participant = await this.prisma.chatParticipant.findUnique({
            where: { chatGroupId_userId: { chatGroupId, userId } },
        });
        if (!participant || participant.leftAt) {
            throw new common_1.ForbiddenException('Not a member of this chat');
        }
        return participant;
    }
    async getGroupIdsForUser(userId) {
        const rows = await this.prisma.chatParticipant.findMany({
            where: { userId, leftAt: null },
            select: { chatGroupId: true },
        });
        return rows.map((r) => r.chatGroupId);
    }
    async listGroupsForUser(userId) {
        return this.prisma.chatParticipant.findMany({
            where: { userId, leftAt: null },
            include: {
                chatGroup: {
                    include: {
                        event: { select: { id: true, title: true, slug: true, coverImageUrl: true } },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            where: { status: client_1.ChatMessageStatus.VISIBLE },
                        },
                    },
                },
            },
            orderBy: { chatGroup: { createdAt: 'desc' } },
        });
    }
    async sendMessage(params) {
        await this.assertMember(params.chatGroupId, params.senderId);
        let moderationResult = {
            blocked: false,
            reason: undefined,
            matchedTerm: undefined,
            confidence: undefined,
        };
        if (params.type === client_1.ChatMessageType.TEXT && params.text) {
            moderationResult = await this.moderation.checkText(params.text);
        }
        else if (params.type === client_1.ChatMessageType.IMAGE && params.mediaUrl) {
            moderationResult = await this.moderation.checkImage(this.extractS3Key(params.mediaUrl));
        }
        const bodyToEncrypt = params.text ?? '';
        const { ciphertext, iv, authTag } = this.encryption.encrypt(bodyToEncrypt);
        const message = await this.prisma.chatMessage.create({
            data: {
                chatGroupId: params.chatGroupId,
                senderId: params.senderId,
                type: params.type,
                ciphertext: new Uint8Array(ciphertext),
                iv: new Uint8Array(iv),
                authTag: new Uint8Array(authTag),
                mediaUrl: params.mediaUrl,
                status: moderationResult.blocked
                    ? client_1.ChatMessageStatus.BLOCKED
                    : client_1.ChatMessageStatus.VISIBLE,
            },
        });
        if (moderationResult.blocked) {
            const flag = await this.prisma.chatModerationFlag.create({
                data: {
                    messageId: message.id,
                    reason: moderationResult.reason ?? client_1.ModerationFlagReason.API_FLAGGED,
                    matchedTerm: moderationResult.matchedTerm,
                    confidence: moderationResult.confidence,
                },
            });
        }
        return {
            message,
            blocked: moderationResult.blocked,
            plaintext: moderationResult.blocked ? null : bodyToEncrypt,
        };
    }
    async getMessages(chatGroupId, userId, cursor, limit = 50) {
        await this.assertMember(chatGroupId, userId);
        const messages = await this.prisma.chatMessage.findMany({
            where: {
                chatGroupId,
                status: { in: [client_1.ChatMessageStatus.VISIBLE, client_1.ChatMessageStatus.DELETED_USER] },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        return messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            type: m.type,
            text: m.status === client_1.ChatMessageStatus.DELETED_USER
                ? null
                : this.encryption.decrypt(Buffer.from(m.ciphertext), Buffer.from(m.iv), Buffer.from(m.authTag)),
            mediaUrl: m.mediaUrl,
            createdAt: m.createdAt,
            status: m.status,
        }));
    }
    async markRead(chatGroupId, userId) {
        await this.assertMember(chatGroupId, userId);
        return this.prisma.chatParticipant.update({
            where: { chatGroupId_userId: { chatGroupId, userId } },
            data: { lastReadAt: new Date() },
        });
    }
    async setMute(chatGroupId, userId, muted) {
        await this.assertMember(chatGroupId, userId);
        return this.prisma.chatParticipant.update({
            where: { chatGroupId_userId: { chatGroupId, userId } },
            data: { notificationsMuted: muted },
        });
    }
    async shouldNotify(chatGroupId, userId) {
        const participant = await this.prisma.chatParticipant.findUnique({
            where: { chatGroupId_userId: { chatGroupId, userId } },
        });
        if (!participant || participant.leftAt)
            return false;
        if (participant.notificationsMuted)
            return false;
        if (participant.adminMutedUntil && participant.adminMutedUntil > new Date())
            return false;
        return true;
    }
    async listModerationFlags(status = 'PENDING', page = 1, limit = 20) {
        const flags = await this.prisma.chatModerationFlag.findMany({
            where: status === 'PENDING' ? { action: null } : { action: { isNot: null } },
            include: {
                message: {
                    include: {
                        chatGroup: { include: { event: { select: { id: true, title: true } } } },
                    },
                },
                action: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return flags.map((f) => ({
            flagId: f.id,
            reason: f.reason,
            matchedTerm: f.matchedTerm,
            confidence: f.confidence,
            createdAt: f.createdAt,
            messageId: f.message.id,
            senderId: f.message.senderId,
            text: this.encryption.decrypt(Buffer.from(f.message.ciphertext), Buffer.from(f.message.iv), Buffer.from(f.message.authTag)),
            messageStatus: f.message.status,
            eventId: f.message.chatGroup.event.id,
            eventTitle: f.message.chatGroup.event.title,
            action: f.action,
        }));
    }
    async resolveModerationFlag(flagId, adminId, actionType, notes) {
        const flag = await this.prisma.chatModerationFlag.findUnique({
            where: { id: flagId },
            include: { action: true },
        });
        if (!flag)
            throw new common_1.NotFoundException('Flag not found');
        if (flag.action)
            throw new common_1.BadRequestException('Flag already resolved');
        const action = await this.prisma.chatModerationAction.create({
            data: { flagId, adminId, actionType, notes },
        });
        if (actionType === client_1.ModerationActionType.DISMISSED) {
            await this.prisma.chatMessage.update({
                where: { id: flag.messageId },
                data: { status: client_1.ChatMessageStatus.VISIBLE },
            });
        }
        else if (actionType === client_1.ModerationActionType.MESSAGE_REMOVED) {
            await this.prisma.chatMessage.update({
                where: { id: flag.messageId },
                data: { status: client_1.ChatMessageStatus.REMOVED_ADMIN },
            });
        }
        return action;
    }
    async uploadChatImage(chatGroupId, userId, file) {
        await this.assertMember(chatGroupId, userId);
        const mediaUrl = await this.storage.uploadFile(file, 'chat-media/', chatGroupId);
        return { mediaUrl };
    }
    extractS3Key(mediaUrl) {
        const marker = '.amazonaws.com/';
        const idx = mediaUrl.indexOf(marker);
        return idx >= 0 ? mediaUrl.slice(idx + marker.length) : mediaUrl;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_encryption_service_1.ChatEncryptionService,
        moderation_service_1.ModerationService,
        storage_service_1.StorageService])
], ChatService);
//# sourceMappingURL=chat.service.js.map