import { Controller, Get, Post, Query, UseGuards, Logger } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { AnalyticsDataService } from './services/analytics-data.service';
import { AnalyticsSyncService } from './services/analytics-sync.service';
import { AnalyticsQueryDto, ReviewsQueryDto, CrashesQueryDto } from './dto/analytics-query.dto';

/**
 * App Analytics Controller
 * Provides endpoints for retrieving app analytics data
 */
@Controller('app-analytics')
@UseGuards(SupabaseAuthGuard)
export class AppAnalyticsController {
  private readonly logger = new Logger(AppAnalyticsController.name);

  constructor(
    private readonly analyticsDataService: AnalyticsDataService,
    private readonly analyticsSyncService: AnalyticsSyncService,
  ) { }

  /**
   * GET /app-analytics/overview
   * Get overall analytics overview
   */
  @Get('overview')
  async getOverview(@Query() query: AnalyticsQueryDto) {
    this.logger.log('Fetching analytics overview');
    return this.analyticsDataService.getOverview(query);
  }

  /**
   * GET /app-analytics/revenue
   * Get revenue analytics
   */
  @Get('revenue')
  async getRevenue(@Query() query: AnalyticsQueryDto) {
    this.logger.log('Fetching revenue analytics');
    return this.analyticsDataService.getRevenue(query);
  }

  /**
   * GET /app-analytics/users
   * Get user analytics (DAU, MAU, retention)
   */
  @Get('users')
  async getUserAnalytics(@Query() query: AnalyticsQueryDto) {
    this.logger.log('Fetching user analytics');
    return this.analyticsDataService.getUserAnalytics(query);
  }

  /**
   * GET /app-analytics/reviews
   * Get app reviews
   */
  @Get('reviews')
  async getReviews(@Query() query: ReviewsQueryDto) {
    this.logger.log('Fetching reviews');
    return this.analyticsDataService.getReviews(query);
  }

  /**
   * GET /app-analytics/crashes
   * Get crash analytics
   */
  @Get('crashes')
  async getCrashAnalytics(@Query() query: CrashesQueryDto) {
    this.logger.log('Fetching crash analytics');
    return this.analyticsDataService.getCrashAnalytics(query);
  }

  /**
   * GET /app-analytics/sync/status
   * Get sync status
   */
  @Get('sync/status')
  async getSyncStatus() {
    this.logger.log('Fetching sync status');
    // This would query the analytics_sync_status table
    return { message: 'Sync status endpoint' };
  }

  /**
   * POST /app-analytics/sync/trigger
   * Manually trigger a sync (admin only)
   */
  @Post('sync/trigger')
  async triggerSync() {
    this.logger.log('Manually triggering analytics sync');
    try {
      await this.analyticsSyncService.syncAll();
      return { message: 'Sync triggered successfully' };
    } catch (error) {
      this.logger.error(`Error triggering sync: ${error.message}`);
      return { message: 'Sync failed', error: error.message };
    }
  }
}
