import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatEncryptionService } from './chat-encryption.service';
import {
  ModerationService,
  ModerationResult,
} from './moderation/moderation.service';
import { AdminAlertService } from './admin-alert.service';
import {
  ChatMessageStatus,
  ChatMessageType,
  ChatParticipantRole,
  ModerationFlagReason,
} from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: ChatEncryptionService,
    private readonly moderation: ModerationService,
    private readonly adminAlerts: AdminAlertService,
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
      moderationResult = await this.moderation.checkImage(params.mediaUrl);
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
      this.adminAlerts
        .notifyFlaggedMessage({
          flagId: flag.id,
          messageId: message.id,
          chatGroupId: params.chatGroupId,
          senderId: params.senderId,
          plaintext: bodyToEncrypt, // admin alert needs to show the actual text — see AdminAlertService for handling
        })
        .catch(() => {
          /* logged inside AdminAlertService */
        });
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
}
