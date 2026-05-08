import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../permissions/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('organizations/:id/overall')
  async getOrganizationOverall(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getOrganizationOverall(user.sub, id, query);
  }

  @Get('organizations/:id/individual')
  async getOrganizationIndividual(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getOrganizationIndividual(user.sub, id, query);
  }

  @Get('events/:id')
  async getEventAnalytics(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getEventAnalytics(user.sub, id, query);
  }

  @Post('organizations/:id/export')
  @HttpCode(HttpStatus.OK)
  async exportReport(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.exportReport(user.sub, id, query);
  }
}
