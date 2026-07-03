import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@UseGuards(JwtAuthGuard)
@Controller('users/me/notification-settings')
export class NotificationSettingsController {
  constructor(private readonly service: NotificationSettingsService) {}

  @Get()
  async get(@Req() req: any) {
    return this.service.get(req.user.id);
  }

  @Patch()
  async update(@Req() req: any, @Body() dto: UpdateNotificationSettingsDto) {
    return this.service.update(req.user.id, dto);
  }
}
