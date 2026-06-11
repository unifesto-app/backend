import { Controller, Get, Post, Delete, Body, UseGuards, Logger, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { RoleCode } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @Roles(RoleCode.ADMIN)
  async getHealth() {
    this.logger.log('Health check endpoint called');
    return this.adminService.getHealthStatus();
  }

  @Post('device-token')
  @Roles(RoleCode.ADMIN)
  async registerDeviceToken(
    @CurrentUser() user: User,
    @Body() body: { fcmToken: string; platform?: string },
  ) {
    return this.adminService.registerDeviceToken(user.id, body.fcmToken, body.platform || 'ios');
  }

  @Delete('device-token')
  @Roles(RoleCode.ADMIN)
  async unregisterDeviceToken(
    @CurrentUser() user: User,
    @Body() body: { fcmToken: string },
  ) {
    return this.adminService.unregisterDeviceToken(user.id, body.fcmToken);
  }
}
