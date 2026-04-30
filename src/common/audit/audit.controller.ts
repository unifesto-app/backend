import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RateLimit } from '../guards/rate-limit.guard';

@Controller('audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('super_admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/logs
   * Get audit logs (super_admin only)
   */
  @Get('logs')
  @RateLimit({ maxRequests: 50, windowMinutes: 1 })
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('project') project?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: any = {};

    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (project) filters.project = project;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    const result = await this.auditService.getLogs(filters);

    return {
      logs: result.logs,
      total: result.total,
      filters,
    };
  }

  /**
   * GET /audit/stats
   * Get audit statistics (super_admin only)
   */
  @Get('stats')
  @RateLimit({ maxRequests: 20, windowMinutes: 1 })
  async getStats(
    @Query('userId') userId?: string,
    @Query('project') project?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (userId) filters.userId = userId;
    if (project) filters.project = project;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const stats = await this.auditService.getStats(filters);

    return {
      stats,
      filters,
    };
  }
}
