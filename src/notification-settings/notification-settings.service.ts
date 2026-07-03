import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

const DEFAULTS = {
  chatMessages: true,
  eventReminders: true,
  registrationUpdates: true,
  walletUpdates: true,
  spaceUpdates: true,
};

@Injectable()
export class NotificationSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const row = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });
    return row ?? { userId, ...DEFAULTS };
  }

  async update(userId: string, dto: UpdateNotificationSettingsDto) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...DEFAULTS, ...dto },
    });
  }

  /**
   * Called by the chat push-fan-out step (and any other push pipeline)
   * before sending a notification, alongside ChatService.shouldNotify()
   * for the per-chat mute check.
   */
  async isCategoryEnabled(
    userId: string,
    category: keyof typeof DEFAULTS,
  ): Promise<boolean> {
    const settings = await this.get(userId);
    return (settings as any)[category] ?? true;
  }
}
