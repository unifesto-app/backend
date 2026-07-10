import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ChatEncryptionService } from './chat-encryption.service';
import { ModerationService } from './moderation/moderation.service';
import { ChatMessageType, ModerationActionType } from '@prisma/client';
export declare class ChatService {
    private readonly prisma;
    private readonly encryption;
    private readonly moderation;
    private readonly storage;
    constructor(prisma: PrismaService, encryption: ChatEncryptionService, moderation: ModerationService, storage: StorageService);
    createGroupForEvent(eventId: string, spaceId: string, organiserIds: string[]): Promise<{
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.ChatGroupType;
        status: import("@prisma/client").$Enums.ChatGroupStatus;
        spaceId: string;
        eventId: string;
        archivedAt: Date | null;
    }>;
    addParticipant(eventId: string, userId: string): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        userId: string;
        joinedAt: Date;
        leftAt: Date | null;
        notificationsMuted: boolean;
        adminMutedUntil: Date | null;
        lastReadAt: Date | null;
        chatGroupId: string;
    } | null>;
    removeParticipant(eventId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload | null>;
    archiveGroup(eventId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    assertMember(chatGroupId: string, userId: string): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        userId: string;
        joinedAt: Date;
        leftAt: Date | null;
        notificationsMuted: boolean;
        adminMutedUntil: Date | null;
        lastReadAt: Date | null;
        chatGroupId: string;
    }>;
    getGroupIdsForUser(userId: string): Promise<string[]>;
    listGroupsForUser(userId: string): Promise<({
        chatGroup: {
            event: {
                id: string;
                slug: string;
                title: string;
                coverImageUrl: string | null;
            };
            messages: {
                id: string;
                createdAt: Date;
                type: import("@prisma/client").$Enums.ChatMessageType;
                status: import("@prisma/client").$Enums.ChatMessageStatus;
                chatGroupId: string;
                ciphertext: import("@prisma/client/runtime/library").Bytes;
                iv: import("@prisma/client/runtime/library").Bytes;
                authTag: import("@prisma/client/runtime/library").Bytes;
                senderId: string;
                mediaUrl: string | null;
                editedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.ChatGroupType;
            status: import("@prisma/client").$Enums.ChatGroupStatus;
            spaceId: string;
            eventId: string;
            archivedAt: Date | null;
        };
    } & {
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        userId: string;
        joinedAt: Date;
        leftAt: Date | null;
        notificationsMuted: boolean;
        adminMutedUntil: Date | null;
        lastReadAt: Date | null;
        chatGroupId: string;
    })[]>;
    sendMessage(params: {
        chatGroupId: string;
        senderId: string;
        type: ChatMessageType;
        text?: string;
        mediaUrl?: string;
    }): Promise<{
        message: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.ChatMessageType;
            status: import("@prisma/client").$Enums.ChatMessageStatus;
            chatGroupId: string;
            ciphertext: import("@prisma/client/runtime/library").Bytes;
            iv: import("@prisma/client/runtime/library").Bytes;
            authTag: import("@prisma/client/runtime/library").Bytes;
            senderId: string;
            mediaUrl: string | null;
            editedAt: Date | null;
        };
        blocked: boolean;
        plaintext: string | null;
    }>;
    getMessages(chatGroupId: string, userId: string, cursor?: string, limit?: number): Promise<{
        id: string;
        senderId: string;
        type: import("@prisma/client").$Enums.ChatMessageType;
        text: string | null;
        mediaUrl: string | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ChatMessageStatus;
    }[]>;
    markRead(chatGroupId: string, userId: string): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        userId: string;
        joinedAt: Date;
        leftAt: Date | null;
        notificationsMuted: boolean;
        adminMutedUntil: Date | null;
        lastReadAt: Date | null;
        chatGroupId: string;
    }>;
    setMute(chatGroupId: string, userId: string, muted: boolean): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.ChatParticipantRole;
        userId: string;
        joinedAt: Date;
        leftAt: Date | null;
        notificationsMuted: boolean;
        adminMutedUntil: Date | null;
        lastReadAt: Date | null;
        chatGroupId: string;
    }>;
    shouldNotify(chatGroupId: string, userId: string): Promise<boolean>;
    listModerationFlags(status?: 'PENDING' | 'RESOLVED', page?: number, limit?: number): Promise<{
        flagId: string;
        reason: import("@prisma/client").$Enums.ModerationFlagReason;
        matchedTerm: string | null;
        confidence: number | null;
        createdAt: Date;
        messageId: string;
        senderId: string;
        text: string;
        messageStatus: import("@prisma/client").$Enums.ChatMessageStatus;
        eventId: string;
        eventTitle: string;
        action: {
            id: string;
            createdAt: Date;
            notes: string | null;
            flagId: string;
            adminId: string;
            actionType: import("@prisma/client").$Enums.ModerationActionType;
        } | null;
    }[]>;
    resolveModerationFlag(flagId: string, adminId: string, actionType: ModerationActionType, notes?: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        flagId: string;
        adminId: string;
        actionType: import("@prisma/client").$Enums.ModerationActionType;
    }>;
    uploadChatImage(chatGroupId: string, userId: string, file: Express.Multer.File): Promise<{
        mediaUrl: string;
    }>;
    private extractS3Key;
}
