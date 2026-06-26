import { Controller, Get, Post, Delete, Body, Query, UseGuards, Logger, Request } from '@nestjs/common';
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

  /**
   * Platform-wide analytics overview (ADMIN only)
   * GET /admin/analytics/overview
   */
  @Get('analytics/overview')
  @Roles(RoleCode.ADMIN)
  async getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  /**
   * List all events incl. drafts for moderation (ADMIN only)
   * GET /admin/events?page=1&limit=20&status=PUBLISHED&search=tech
   */
  @Get('events')
  @Roles(RoleCode.ADMIN)
  async getAllEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllEvents({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      search,
    });
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
