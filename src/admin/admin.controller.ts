import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/health
   * Returns the health status of all infrastructure services
   * Protected by JWT auth + ADMIN role
   */
  @Get('health')
  @Roles(RoleCode.ADMIN)
  async getHealth() {
    this.logger.log('Health check endpoint called');
    return this.adminService.getHealthStatus();
  }
}
