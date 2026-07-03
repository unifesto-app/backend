import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ChatEncryptionService } from './chat-encryption.service';
import {
  ModerationService,
  ModerationResult,
} from './moderation/moderation.service';
import {
  ChatMessageStatus,
  ChatMessageType,
  ChatParticipantRole,
  ModerationFlagReason,
  ModerationActionType,
} from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: ChatEncryptionService,
    private readonly moderation: ModerationService,
    private readonly storage: StorageService,
  ) {}

  // ---------------------------------------------------------------------
  // Group lifecycle
  // ---------------------------------------------------------------------

  /**
   * Call this from EventsService right after an event row is created.
   * Adds the organiser (and any co-organisers already on the space) as
   * ORGANISER participants.
   */
  async createGroupForEvent(
    eventId: string,
    spaceId: string,
    organiserIds: string[],
  ) {
    const group = await this.prisma.chatGroup.create({
      data: {
        eventId,
        spaceId,
        participants: {
          create: organiserIds.map((userId) => ({
            userId,
            role: ChatParticipantRole.ORGANISER,
          })),
        },
      },
    });
    return group;
  }

  /**
   * Call this from RegistrationsService after a successful RSVP or ticket
   * purchase is confirmed.
   */
  async addParticipant(eventId: string, userId: string) {
    const group = await this.prisma.chatGroup.findUnique({
      where: { eventId },
    });
    if (!group) return null; // event has no chat group (shouldn't happen, but don't hard-fail registration over it)

    return this.prisma.chatParticipant.upsert({
      where: { chatGroupId_userId: { chatGroupId: group.id, userId } },
      update: { leftAt: null },
      create: {
        chatGroupId: group.id,
        userId,
        role: ChatParticipantRole.ATTENDEE,
      },
    });
  }

  /**
   * Call this from RegistrationsService.cancelRegistration(). We keep the
   * row (and message history) for moderation/audit purposes, just mark
   * them as left so they lose access.
   */
  async removeParticipant(eventId: string, userId: string) {
    const group = await this.prisma.chatGroup.findUnique({
      where: { eventId },
    });
    if (!group) return null;

    return this.prisma.chatParticipant.updateMany({
      where: { chatGroupId: group.id, userId },
      data: { leftAt: new Date() },
    });
  }

  async archiveGroup(eventId: string) {
    return this.prisma.chatGroup.updateMany({
      where: { eventId },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------
  // Membership checks
  // ---------------------------------------------------------------------

  async assertMember(chatGroupId: string, userId: string) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatGroupId_userId: { chatGroupId, userId } },
    });
    if (!participant || participant.leftAt) {
      throw new ForbiddenException('Not a member of this chat');
    }
    return participant;
  }

  async getGroupIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.chatParticipant.findMany({
      where: { userId, leftAt: null },
      select: { chatGroupId: true },
    });
    return rows.map((r) => r.chatGroupId);
  }

  async listGroupsForUser(userId: string) {
    return this.prisma.chatParticipant.findMany({
      where: { userId, leftAt: null },
      include: {
        chatGroup: {
          include: {
            event: { select: { id: true, title: true, slug: true, coverImageUrl: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              where: { status: ChatMessageStatus.VISIBLE },
            },
          },
        },
      },
      orderBy: { chatGroup: { createdAt: 'desc' } },
    });
  }

  // ---------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------

  /**
   * Runs moderation, encrypts, and stores the message. Returns the stored
   * row PLUS a `blocked` flag so the gateway knows whether to broadcast it
   * or return the "removed" notice to the sender only.
   */
  async sendMessage(params: {
    chatGroupId: string;
    senderId: string;
    type: ChatMessageType;
    text?: string;
    mediaUrl?: string;
  }) {
    await this.assertMember(params.chatGroupId, params.senderId);

    let moderationResult: ModerationResult = {
      blocked: false,
      reason: undefined as any,
      matchedTerm: undefined as any,
      confidence: undefined as any,
    };

    if (params.type === ChatMessageType.TEXT && params.text) {
      moderationResult = await this.moderation.checkText(params.text);
    } else if (params.type === ChatMessageType.IMAGE && params.mediaUrl) {
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
          ? ChatMessageStatus.BLOCKED
          : ChatMessageStatus.VISIBLE,
      },
    });

    if (moderationResult.blocked) {
      const flag = await this.prisma.chatModerationFlag.create({
        data: {
          messageId: message.id,
          reason: moderationResult.reason ?? ModerationFlagReason.API_FLAGGED,
          matchedTerm: moderationResult.matchedTerm,
          confidence: moderationResult.confidence,
        },
      });
      // Fire admin alert asynchronously — don't block the response on push delivery.
      // No push here — flagged messages are surfaced to admins via the
      // moderation queue endpoints below (listModerationFlags), which Apex
      // polls/displays. The flag row created above IS the notification.
    }

    return {
      message,
      blocked: moderationResult.blocked,
      // Only return decrypted text to the caller for immediate local echo —
      // never send other participants' ciphertext back undecrypted without
      // going through getMessages() below.
      plaintext: moderationResult.blocked ? null : bodyToEncrypt,
    };
  }

  async getMessages(chatGroupId: string, userId: string, cursor?: string, limit = 50) {
    await this.assertMember(chatGroupId, userId);

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        chatGroupId,
        status: { in: [ChatMessageStatus.VISIBLE, ChatMessageStatus.DELETED_USER] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      type: m.type,
      text:
        m.status === ChatMessageStatus.DELETED_USER
          ? null
          : this.encryption.decrypt(
              Buffer.from(m.ciphertext),
              Buffer.from(m.iv),
              Buffer.from(m.authTag),
            ),
      mediaUrl: m.mediaUrl,
      createdAt: m.createdAt,
      status: m.status,
    }));
  }

  async markRead(chatGroupId: string, userId: string) {
    await this.assertMember(chatGroupId, userId);
    return this.prisma.chatParticipant.update({
      where: { chatGroupId_userId: { chatGroupId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------
  // Mute
  // ---------------------------------------------------------------------

  async setMute(chatGroupId: string, userId: string, muted: boolean) {
    await this.assertMember(chatGroupId, userId);
    return this.prisma.chatParticipant.update({
      where: { chatGroupId_userId: { chatGroupId, userId } },
      data: { notificationsMuted: muted },
    });
  }

  /**
   * Used by the push-notification step to decide whether to fire a push
   * for a given recipient: skip if they muted this chat OR are currently
   * admin-muted OR have globally disabled chat notifications (checked
   * separately via NotificationSettingsService).
   */
  async shouldNotify(chatGroupId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatGroupId_userId: { chatGroupId, userId } },
    });
    if (!participant || participant.leftAt) return false;
    if (participant.notificationsMuted) return false;
    if (participant.adminMutedUntil && participant.adminMutedUntil > new Date()) return false;
    return true;
  }


  // ---------------------------------------------------------------------
  // Admin moderation queue (surfaced in Apex)
  // ---------------------------------------------------------------------

  async listModerationFlags(
    status: 'PENDING' | 'RESOLVED' = 'PENDING',
    page = 1,
    limit = 20,
  ) {
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
      text: this.encryption.decrypt(
        Buffer.from(f.message.ciphertext),
        Buffer.from(f.message.iv),
        Buffer.from(f.message.authTag),
      ),
      messageStatus: f.message.status,
      eventId: f.message.chatGroup.event.id,
      eventTitle: f.message.chatGroup.event.title,
      action: f.action,
    }));
  }

  async resolveModerationFlag(
    flagId: string,
    adminId: string,
    actionType: ModerationActionType,
    notes?: string,
  ) {
    const flag = await this.prisma.chatModerationFlag.findUnique({
      where: { id: flagId },
      include: { action: true },
    });
    if (!flag) throw new NotFoundException('Flag not found');
    if (flag.action) throw new BadRequestException('Flag already resolved');

    const action = await this.prisma.chatModerationAction.create({
      data: { flagId, adminId, actionType, notes },
    });

    if (actionType === ModerationActionType.DISMISSED) {
      await this.prisma.chatMessage.update({
        where: { id: flag.messageId },
        data: { status: ChatMessageStatus.VISIBLE },
      });
    } else if (actionType === ModerationActionType.MESSAGE_REMOVED) {
      await this.prisma.chatMessage.update({
        where: { id: flag.messageId },
        data: { status: ChatMessageStatus.REMOVED_ADMIN },
      });
    }

    return action;
  }


  // ---------------------------------------------------------------------
  // Image upload (chat-scoped, feeds into Rekognition moderation)
  // ---------------------------------------------------------------------

  async uploadChatImage(chatGroupId: string, userId: string, file: Express.Multer.File) {
    await this.assertMember(chatGroupId, userId);
    const mediaUrl = await this.storage.uploadFile(file, 'chat-media/', chatGroupId);
    return { mediaUrl };
  }

  private extractS3Key(mediaUrl: string): string {
    const marker = '.amazonaws.com/';
    const idx = mediaUrl.indexOf(marker);
    return idx >= 0 ? mediaUrl.slice(idx + marker.length) : mediaUrl;
  }
}