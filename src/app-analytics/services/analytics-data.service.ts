import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/database/supabase.service';
import {
  AnalyticsOverviewResponse,
  RevenueAnalyticsResponse,
  UserAnalyticsResponse,
  ReviewsResponse,
  CrashAnalyticsResponse,
  Platform,
  Crash,
} from '../types/analytics.types';
import { AnalyticsQueryDto, ReviewsQueryDto, CrashesQueryDto } from '../dto/analytics-query.dto';

/**
 * Analytics Data Service
 * Retrieves and aggregates analytics data from Supabase
 */
@Injectable()
export class AnalyticsDataService {
  private readonly logger = new Logger(AnalyticsDataService.name);

  constructor(private readonly supabaseService: SupabaseService) { }

  /**
   * Get analytics overview
   */
  async getOverview(query: AnalyticsQueryDto): Promise<AnalyticsOverviewResponse> {
    const { startDate, endDate, platform } = this.parseDateRange(query);

    try {
      // Build query
      let metricsQuery = this.supabaseService
        .getClient()
        .from('analytics_daily_metrics')
        .select('*')
        .gte('metric_date', startDate)
        .lte('metric_date', endDate);

      if (platform && platform !== 'all') {
        metricsQuery = metricsQuery.eq('platform', platform);
      }

      const { data: metrics, error } = await metricsQuery;

      if (error) throw error;

      // Aggregate metrics
      const totals = {
        totalDownloads: 0,
        totalInstalls: 0,
        totalActiveUsers: 0,
        totalRevenue: 0,
        totalSessions: 0,
        avgCrashFreePercentage: 0,
      };

      const byPlatform = {
        ios: { downloads: 0, installs: 0, activeUsers: 0, revenue: 0, sessions: 0, crashFreePercentage: 0 },
        android: { downloads: 0, installs: 0, activeUsers: 0, revenue: 0, sessions: 0, crashFreePercentage: 0 },
      };

      let iosCount = 0;
      let androidCount = 0;

      metrics?.forEach((metric: any) => {
        const downloads = metric.downloads || 0;
        const installs = metric.installs || 0;
        const activeUsers = metric.active_users || 0;
        const revenue = (metric.revenue_cents || 0) / 100;
        const sessions = metric.sessions || 0;
        const crashFree = metric.crash_free_users_percentage || 100;

        totals.totalDownloads += downloads;
        totals.totalInstalls += installs;
        totals.totalActiveUsers += activeUsers;
        totals.totalRevenue += revenue;
        totals.totalSessions += sessions;

        if (metric.platform === 'ios') {
          byPlatform.ios.downloads += downloads;
          byPlatform.ios.installs += installs;
          byPlatform.ios.activeUsers += activeUsers;
          byPlatform.ios.revenue += revenue;
          byPlatform.ios.sessions += sessions;
          byPlatform.ios.crashFreePercentage += crashFree;
          iosCount++;
        } else if (metric.platform === 'android') {
          byPlatform.android.downloads += downloads;
          byPlatform.android.installs += installs;
          byPlatform.android.activeUsers += activeUsers;
          byPlatform.android.revenue += revenue;
          byPlatform.android.sessions += sessions;
          byPlatform.android.crashFreePercentage += crashFree;
          androidCount++;
        }
      });

      // Calculate averages
      if (iosCount > 0) {
        byPlatform.ios.crashFreePercentage /= iosCount;
      }
      if (androidCount > 0) {
        byPlatform.android.crashFreePercentage /= androidCount;
      }
      totals.avgCrashFreePercentage = (byPlatform.ios.crashFreePercentage + byPlatform.android.crashFreePercentage) / 2;

      return {
        period: {
          startDate,
          endDate,
        },
        metrics: totals,
        byPlatform,
      };
    } catch (error) {
      this.logger.error(`Error fetching overview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenue(query: AnalyticsQueryDto): Promise<RevenueAnalyticsResponse> {
    const { startDate, endDate, platform } = this.parseDateRange(query);

    try {
      let metricsQuery = this.supabaseService
        .getClient()
        .from('analytics_daily_metrics')
        .select('*')
        .gte('metric_date', startDate)
        .lte('metric_date', endDate)
        .order('metric_date', { ascending: true });

      if (platform && platform !== 'all') {
        metricsQuery = metricsQuery.eq('platform', platform);
      }

      const { data: metrics, error } = await metricsQuery;

      if (error) throw error;

      // Aggregate revenue
      let totalRevenue = 0;
      let totalProceeds = 0;
      const byPlatform = {
        ios: { revenue: 0, proceeds: 0, subscriptionRevenue: 0, newSubscriptions: 0, activeSubscriptions: 0 },
        android: { revenue: 0, proceeds: 0, subscriptionRevenue: 0, newSubscriptions: 0, activeSubscriptions: 0 },
      };

      const chartDataMap = new Map<string, any>();

      metrics?.forEach((metric: any) => {
        const revenue = (metric.revenue_cents || 0) / 100;
        const proceeds = (metric.proceeds_cents || 0) / 100;
        const subRevenue = (metric.subscription_revenue_cents || 0) / 100;

        totalRevenue += revenue;
        totalProceeds += proceeds;

        const platformData = metric.platform === 'ios' ? byPlatform.ios : byPlatform.android;
        platformData.revenue += revenue;
        platformData.proceeds += proceeds;
        platformData.subscriptionRevenue += subRevenue;
        platformData.newSubscriptions += metric.new_subscriptions || 0;
        platformData.activeSubscriptions = Math.max(platformData.activeSubscriptions, metric.active_subscriptions || 0);

        // Chart data
        const dateKey = metric.metric_date;
        if (!chartDataMap.has(dateKey)) {
          chartDataMap.set(dateKey, { date: dateKey, ios: 0, android: 0, total: 0 });
        }
        const chartPoint = chartDataMap.get(dateKey);
        if (metric.platform === 'ios') {
          chartPoint.ios += revenue;
        } else {
          chartPoint.android += revenue;
        }
        chartPoint.total += revenue;
      });

      const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      return {
        period: { startDate, endDate },
        totalRevenue,
        totalProceeds,
        currency: 'USD',
        byPlatform,
        chartData,
      };
    } catch (error) {
      this.logger.error(`Error fetching revenue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(query: AnalyticsQueryDto): Promise<UserAnalyticsResponse> {
    const { startDate, endDate, platform } = this.parseDateRange(query);

    try {
      let metricsQuery = this.supabaseService
        .getClient()
        .from('analytics_daily_metrics')
        .select('*')
        .gte('metric_date', startDate)
        .lte('metric_date', endDate)
        .order('metric_date', { ascending: true });

      if (platform && platform !== 'all') {
        metricsQuery = metricsQuery.eq('platform', platform);
      }

      const { data: metrics, error } = await metricsQuery;

      if (error) throw error;

      // Aggregate user metrics
      let totalActiveUsers = 0;
      let totalNewUsers = 0;
      let totalDau = 0;
      let totalMau = 0;
      let retentionDay1 = 0;
      let retentionDay7 = 0;
      let retentionDay30 = 0;
      let retentionCount = 0;

      const chartData: any[] = [];

      metrics?.forEach((metric: any) => {
        totalActiveUsers += metric.active_users || 0;
        totalNewUsers += metric.new_users || 0;
        totalDau += metric.dau || 0;
        totalMau = Math.max(totalMau, metric.mau || 0);

        if (metric.retention_day_1 > 0) {
          retentionDay1 += metric.retention_day_1;
          retentionDay7 += metric.retention_day_7;
          retentionDay30 += metric.retention_day_30;
          retentionCount++;
        }

        chartData.push({
          date: metric.metric_date,
          activeUsers: metric.active_users || 0,
          newUsers: metric.new_users || 0,
          dau: metric.dau || 0,
        });
      });

      const avgDau = metrics.length > 0 ? totalDau / metrics.length : 0;
      const dauMauRatio = totalMau > 0 ? (avgDau / totalMau) * 100 : 0;

      return {
        period: { startDate, endDate },
        metrics: {
          totalActiveUsers,
          totalNewUsers,
          avgDau,
          avgMau: totalMau,
          dauMauRatio,
        },
        retention: {
          day1: retentionCount > 0 ? retentionDay1 / retentionCount : 0,
          day7: retentionCount > 0 ? retentionDay7 / retentionCount : 0,
          day30: retentionCount > 0 ? retentionDay30 / retentionCount : 0,
        },
        chartData,
      };
    } catch (error) {
      this.logger.error(`Error fetching user analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reviews
   */
  async getReviews(query: ReviewsQueryDto): Promise<ReviewsResponse> {
    const { startDate, endDate, platform } = this.parseDateRange(query);
    const { page = 1, pageSize = 20, rating } = query;

    try {
      let reviewsQuery = this.supabaseService
        .getClient()
        .from('analytics_reviews')
        .select('*', { count: 'exact' })
        .gte('review_date', startDate)
        .lte('review_date', endDate)
        .order('review_date', { ascending: false });

      if (platform && platform !== 'all') {
        reviewsQuery = reviewsQuery.eq('platform', platform);
      }

      if (rating) {
        reviewsQuery = reviewsQuery.eq('rating', rating);
      }

      // Pagination
      const offset = (page - 1) * pageSize;
      reviewsQuery = reviewsQuery.range(offset, offset + pageSize - 1);

      const { data: reviews, error, count } = await reviewsQuery;

      if (error) throw error;

      // Get rating distribution
      const { data: allReviews } = await this.supabaseService
        .getClient()
        .from('analytics_reviews')
        .select('rating')
        .gte('review_date', startDate)
        .lte('review_date', endDate);

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      allReviews?.forEach((review: any) => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        totalRating += review.rating;
      });

      const averageRating = (allReviews && allReviews.length > 0) ? totalRating / allReviews.length : 0;

      return {
        reviews: (reviews || []).map((r: any) => ({
          id: r.id,
          platform: r.platform,
          source: r.source,
          reviewId: r.review_id,
          rating: r.rating,
          title: r.title,
          reviewText: r.review_text,
          reviewerName: r.reviewer_name,
          reviewerId: r.reviewer_id,
          appVersion: r.app_version,
          developerResponse: r.developer_response,
          developerResponseDate: r.developer_response_date ? new Date(r.developer_response_date) : undefined,
          reviewDate: new Date(r.review_date),
          modifiedDate: r.modified_date ? new Date(r.modified_date) : undefined,
          syncedAt: new Date(r.synced_at),
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        })),
        summary: {
          totalReviews: count || 0,
          averageRating,
          ratingDistribution,
        },
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
          totalCount: count || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get crash analytics
   */
  async getCrashAnalytics(query: CrashesQueryDto): Promise<CrashAnalyticsResponse> {
    const { startDate, endDate, platform } = this.parseDateRange(query);

    try {
      let crashesQuery = this.supabaseService
        .getClient()
        .from('analytics_crashes')
        .select('*')
        .gte('crash_date', startDate)
        .lte('crash_date', endDate);

      if (platform && platform !== 'all') {
        crashesQuery = crashesQuery.eq('platform', platform);
      }

      if (query.appVersion) {
        crashesQuery = crashesQuery.eq('app_version', query.appVersion);
      }

      if (query.crashType) {
        crashesQuery = crashesQuery.eq('crash_type', query.crashType);
      }

      const { data: crashes, error } = await crashesQuery;

      if (error) throw error;

      // Aggregate crash metrics
      let totalCrashes = 0;
      let totalAnrs = 0;
      let totalAffectedUsers = 0;
      const versionMap = new Map<string, any>();

      crashes?.forEach((crash: any) => {
        if (crash.crash_type === 'anr') {
          totalAnrs += crash.occurrence_count || 0;
        } else {
          totalCrashes += crash.occurrence_count || 0;
        }
        totalAffectedUsers += crash.affected_users || 0;

        // By version
        const version = crash.app_version;
        if (!versionMap.has(version)) {
          versionMap.set(version, { version, crashes: 0, anrs: 0, affectedUsers: 0 });
        }
        const versionData = versionMap.get(version);
        if (crash.crash_type === 'anr') {
          versionData.anrs += crash.occurrence_count || 0;
        } else {
          versionData.crashes += crash.occurrence_count || 0;
        }
        versionData.affectedUsers += crash.affected_users || 0;
      });

      // Get crash-free percentage from metrics
      const { data: metrics } = await (this.supabaseService
        .getClient() as any)
        .from('analytics_daily_metrics')
        .select('crash_free_users_percentage')
        .gte('metric_date', startDate)
        .lte('metric_date', endDate);

      let avgCrashFree = 100;
      if (metrics && metrics.length > 0) {
        const sum = (metrics as any[]).reduce((acc, m) => acc + (m.crash_free_users_percentage || 100), 0);
        avgCrashFree = sum / metrics.length;
      }

      // Top crashes
      const topCrashes: Crash[] = (crashes || [])
        .sort((a, b) => (b.occurrence_count || 0) - (a.occurrence_count || 0))
        .slice(0, 10)
        .map((c: any) => ({
          id: c.id,
          platform: c.platform,
          source: c.source,
          crashId: c.crash_id,
          crashType: c.crash_type,
          errorMessage: c.error_message,
          stackTrace: c.stack_trace,
          exceptionType: c.exception_type,
          appVersion: c.app_version,
          osVersion: c.os_version,
          deviceModel: c.device_model,
          occurrenceCount: c.occurrence_count || 0,
          affectedUsers: c.affected_users || 0,
          firstOccurredAt: new Date(c.first_occurred_at),
          lastOccurredAt: new Date(c.last_occurred_at),
          crashDate: new Date(c.crash_date),
          status: c.status,
          syncedAt: new Date(c.synced_at),
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
        }));

      return {
        period: { startDate, endDate },
        metrics: {
          totalCrashes,
          totalAnrs,
          crashFreeUsersPercentage: avgCrashFree,
          affectedUsers: totalAffectedUsers,
        },
        topCrashes,
        byVersion: Array.from(versionMap.values()).sort((a, b) => b.crashes - a.crashes),
      };
    } catch (error) {
      this.logger.error(`Error fetching crash analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse date range from query
   */
  private parseDateRange(query: AnalyticsQueryDto): { startDate: string; endDate: string; platform?: string } {
    const endDate = query.endDate || new Date().toISOString().split('T')[0];
    const startDate = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      startDate,
      endDate,
      platform: query.platform,
    };
  }
}
