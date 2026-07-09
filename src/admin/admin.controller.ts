import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Logger, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
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
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get('health')
  @Roles(RoleCode.ADMIN)
  async getHealth() {
    this.logger.log('Health check endpoint called');
    return this.adminService.getHealthStatus();
  }

  /**
   * List all users (ADMIN only)
   * GET /admin/users?page=1&limit=20&search=query
   */
  @Get('users')
  @Roles(RoleCode.ADMIN)
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.getAllUsers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    });
  }

  /**
   * Get a single user by ID (ADMIN only)
   * GET /admin/users/:id
   */
  @Get('users/:id')
  @Roles(RoleCode.ADMIN)
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserByIdAdmin(id);
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

  @Get('logs')
  @Roles(RoleCode.ADMIN)
  async getLogs(
    @Query('lines') lines?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getPm2Logs({
      lines: lines ? parseInt(lines, 10) : 200,
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
