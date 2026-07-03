import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';

/**
 * Sends the "flagged message" alert to platform admins.
 *
 * Wired to the existing AdminService.sendPushToAdmins(), which already
 * resolves the set of ADMIN users (via their registered admin devices /
 * ADMIN role) and handles the actual FCM delivery. We only build the
 * title/body/data payload here.
 */
@Injectable()
export class AdminAlertService {
  private readonly logger = new Logger(AdminAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
  ) {}

  async notifyFlaggedMessage(params: {
    flagId: string;
    messageId: string;
    chatGroupId: string;
    senderId: string;
    plaintext: string;
  }) {
    const group = await this.prisma.chatGroup.findUnique({
      where: { id: params.chatGroupId },
      include: { event: { select: { id: true, title: true, spaceId: true } } },
    });

    const eventTitle = group?.event?.title ?? 'an event';

    // Data payload for the admin app to deep-link into the moderation queue.
    // Sending a short plaintext preview here is intentional and required by
    // design — admin needs to see exactly what was flagged to make a call.
    // Do NOT log this payload anywhere else (avoid duplicating the flagged
    // content into general application logs).
    const data: Record<string, string> = {
      type: 'CHAT_MODERATION_FLAG',
      flagId: params.flagId,
      messageId: params.messageId,
      chatGroupId: params.chatGroupId,
      eventId: group?.event?.id ?? '',
      eventTitle,
      senderId: params.senderId,
      preview: params.plaintext.slice(0, 500),
    };

    try {
      await this.adminService.sendPushToAdmins(
        'Message flagged for review',
        `A message in "${eventTitle}" was auto-blocked.`,
        data,
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify admins of flagged message: ${err.message}`,
      );
    }
  }
}
