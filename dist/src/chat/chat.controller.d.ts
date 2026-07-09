import { ChatService } from './chat.service';
import { MuteChatDto } from './dto/chat-group.dto';
import { ResolveModerationFlagDto } from './dto/resolve-moderation-flag.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listGroups(req: any): Promise<({
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
    getMessages(req: any, chatGroupId: string, cursor?: string, limit?: string): Promise<{
        id: string;
        senderId: string;
        type: import("@prisma/client").$Enums.ChatMessageType;
        text: string | null;
        mediaUrl: string | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ChatMessageStatus;
    }[]>;
    markRead(req: any, chatGroupId: string): Promise<{
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
    setMute(req: any, dto: MuteChatDto): Promise<{
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
    listModerationFlags(status?: 'PENDING' | 'RESOLVED', page?: string, limit?: string): Promise<{
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
    resolveModerationFlag(req: any, flagId: string, dto: ResolveModerationFlagDto): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        flagId: string;
        adminId: string;
        actionType: import("@prisma/client").$Enums.ModerationActionType;
    }>;
    uploadImage(req: any, chatGroupId: string, file: Express.Multer.File): Promise<{
        mediaUrl: string;
    }>;
}
