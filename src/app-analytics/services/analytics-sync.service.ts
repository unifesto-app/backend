import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/database/supabase.service';
import { AppleAuthService } from './apple/apple-auth.service';
import { AppleAnalyticsService } from './apple/apple-analytics.service';
import { GooglePlayService } from './google/google-play.service';
import { FirebaseAnalyticsService } from './firebase/firebase-analytics.service';
import {
  AppleAuthConfig,
  GoogleAuthConfig,
  FirebaseConfig,
  DateRange,
  SyncJobResult,
  DailyMetric,
  Review,
  Crash,
  CustomEvent,
} from '../types/analytics.types';

/**
 * Analytics Sync Service
 * Orchestrates syncing data from all analytics sources to Supabase
 */
@Injectable()
export class AnalyticsSyncService {
  private readonly logger = new Logger(AnalyticsSyncService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly appleAuthService: AppleAuthService,
    private readonly appleAnalyticsService: AppleAnalyticsService,
    private readonly googlePlayService: GooglePlayService,
    private readonly firebaseAnalyticsService: FirebaseAnalyticsService,
  ) { }

  /**
   * Sync all analytics data (called by cron job)
   */
  async syncAll(): Promise<void> {
    this.logger.log('Starting full analytics sync');

    const dateRange: DateRange = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      endDate: new Date(),
    };

    try {
      const results = await Promise.allSettled([
        this.syncAppleAnalytics(dateRange),
        this.syncGoogleAnalytics(dateRange),
        this.syncFirebaseAnalytics(dateRange),
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const sources = ['Apple', 'Google', 'Firebase'];
          this.logger.error(`${sources[index]} sync failed independently: ${result.reason?.message}`);
        }
      });

      this.logger.log('Full analytics sync completed');
    } catch (error) {
      this.logger.error(`Error in full sync: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync Apple App Store analytics
   */
  async syncAppleAnalytics(dateRange: DateRange): Promise<SyncJobResult> {
    const syncId = await this.createSyncStatus('apple', 'full_sync');
    const startTime = Date.now();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: any[] = [];

    try {
      this.logger.log('Starting Apple analytics sync');

      const config = this.getAppleConfig();
      const appId = this.configService.get<string>('APPLE_APP_ID') || '';

      // Fetch all Apple data
      const [salesReports, subscriptionReports, reviews] = await Promise.allSettled([
        this.appleAnalyticsService.fetchSalesReports(config, dateRange),
        this.appleAnalyticsService.fetchSubscriptionReports(config, dateRange),
        this.appleAnalyticsService.fetchReviews(config, appId),
      ]);

      this.logger.log('Apple crash reports disabled');

      // Process sales reports
      if (salesReports.status === 'fulfilled') {
        const result = await this.saveSalesReports(salesReports.value, 'apple');
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Apple sales reports: ${salesReports.reason}`);
        errors.push({ source: 'sales', error: salesReports.reason.message });
      }

      // Process subscription reports
      if (subscriptionReports.status === 'fulfilled') {
        const result = await this.saveSubscriptionReports(subscriptionReports.value, 'apple');
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Apple subscription reports: ${subscriptionReports.reason}`);
        errors.push({ source: 'subscriptions', error: subscriptionReports.reason.message });
      }

      // Process reviews
      if (reviews.status === 'fulfilled') {
        const result = await this.saveReviews(reviews.value, 'ios', 'apple');
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Apple reviews: ${reviews.reason}`);
        errors.push({ source: 'reviews', error: reviews.reason.message });
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);
      await this.completeSyncStatus(syncId, 'success', recordsSynced, recordsFailed, duration);

      this.logger.log(`Apple analytics sync completed: ${recordsSynced} synced, ${recordsFailed} failed`);

      return {
        success: true,
        recordsSynced,
        recordsFailed,
        errors,
        duration,
      };
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      await this.completeSyncStatus(syncId, 'failed', recordsSynced, recordsFailed, duration, error.message);
      throw error;
    }
  }

  /**
   * Sync Google Play analytics
   */
  async syncGoogleAnalytics(dateRange: DateRange): Promise<SyncJobResult> {
    const syncId = await this.createSyncStatus('google', 'full_sync');
    const startTime = Date.now();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: any[] = [];

    try {
      this.logger.log('Starting Google Play analytics sync');

      const config = this.getGoogleConfig();

      // Fetch all Google data
      const [installsReports, subscriptionReports, reviews, crashReports, anrReports] =
        await Promise.allSettled([
          this.googlePlayService.fetchInstallsReports(config, dateRange),
          this.googlePlayService.fetchSubscriptionReports(config, dateRange),
          this.googlePlayService.fetchReviews(config),
          this.googlePlayService.fetchCrashReports(config, dateRange),
          this.googlePlayService.fetchANRReports(config, dateRange),
        ]);

      // Process installs reports
      if (installsReports.status === 'fulfilled') {
        const result = await this.saveInstallsReports(installsReports.value, 'google');
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Google installs reports: ${installsReports.reason}`);
        errors.push({ source: 'installs', error: installsReports.reason.message });
      }

      // Process subscription reports
      if (subscriptionReports.status === 'fulfilled') {
        const result = await this.saveSubscriptionReports(subscriptionReports.value, 'google');
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Google subscription reports: ${subscriptionReports.reason}`);
        errors.push({ source: 'subscriptions', error: subscriptionReports.reason.message });
      }

      // Process reviews
      if (reviews.status === 'fulfilled') {
        const result = await this.saveGoogleReviews(reviews.value);
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Google reviews: ${reviews.reason}`);
        errors.push({ source: 'reviews', error: reviews.reason.message });
      }

      // Process crash reports
      if (crashReports.status === 'fulfilled') {
        const result = await this.saveGoogleCrashReports(crashReports.value);
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Google crash reports: ${crashReports.reason}`);
        errors.push({ source: 'crashes', error: crashReports.reason.message });
      }

      // Process ANR reports
      if (anrReports.status === 'fulfilled') {
        const result = await this.saveGoogleANRReports(anrReports.value);
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      } else {
        this.logger.error(`Failed to fetch Google ANR reports: ${anrReports.reason}`);
        errors.push({ source: 'anr', error: anrReports.reason.message });
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);
      await this.completeSyncStatus(syncId, 'success', recordsSynced, recordsFailed, duration);

      this.logger.log(`Google Play analytics sync completed: ${recordsSynced} synced, ${recordsFailed} failed`);

      return {
        success: true,
        recordsSynced,
        recordsFailed,
        errors,
        duration,
      };
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      await this.completeSyncStatus(syncId, 'failed', recordsSynced, recordsFailed, duration, error.message);
      throw error;
    }
  }

  /**
   * Sync Firebase analytics
   */
  async syncFirebaseAnalytics(dateRange: DateRange): Promise<SyncJobResult> {
    const syncId = await this.createSyncStatus('firebase', 'full_sync');
    const startTime = Date.now();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: any[] = [];

    try {
      this.logger.log('Starting Firebase analytics sync');

      const config = this.getFirebaseConfig();

      // Fetch Firebase data for both platforms
      const [iosMetrics, androidMetrics, iosRetention, androidRetention, customEvents] =
        await Promise.allSettled([
          this.firebaseAnalyticsService.fetchDailyMetrics(config, dateRange, 'ios'),
          this.firebaseAnalyticsService.fetchDailyMetrics(config, dateRange, 'android'),
          this.firebaseAnalyticsService.fetchRetentionCohorts(config, dateRange, 'ios'),
          this.firebaseAnalyticsService.fetchRetentionCohorts(config, dateRange, 'android'),
          this.firebaseAnalyticsService.fetchCustomEvents(config, dateRange),
        ]);

      // Process iOS metrics
      if (iosMetrics.status === 'fulfilled') {
        const result = await this.saveFirebaseMetrics(iosMetrics.value, iosRetention.status === 'fulfilled' ? iosRetention.value : []);
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      }

      // Process Android metrics
      if (androidMetrics.status === 'fulfilled') {
        const result = await this.saveFirebaseMetrics(androidMetrics.value, androidRetention.status === 'fulfilled' ? androidRetention.value : []);
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      }

      // Process custom events
      if (customEvents.status === 'fulfilled') {
        const result = await this.saveCustomEvents(customEvents.value);
        recordsSynced += result.synced;
        recordsFailed += result.failed;
        errors.push(...result.errors);
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);
      await this.completeSyncStatus(syncId, 'success', recordsSynced, recordsFailed, duration);

      this.logger.log(`Firebase analytics sync completed: ${recordsSynced} synced, ${recordsFailed} failed`);

      return {
        success: true,
        recordsSynced,
        recordsFailed,
        errors,
        duration,
      };
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      await this.completeSyncStatus(syncId, 'failed', recordsSynced, recordsFailed, duration, error.message);
      throw error;
    }
  }

  // =====================================================
  // SAVE METHODS
  // =====================================================

  private async saveSalesReports(reports: any[], source: string): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const report of reports) {
      try {
        await this.supabaseService.getClient()
          .from('analytics_daily_metrics')
          .upsert({
            platform: 'ios',
            source,
            metric_date: report.date,
            downloads: report.downloads,
            revenue_cents: Math.round(report.proceeds * 100),
            currency: report.currency,
            raw_data: report,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,source,metric_date',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: report, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveSubscriptionReports(reports: any[], source: string): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const report of reports) {
      try {
        const platform = source === 'apple' ? 'ios' : 'android';
        await this.supabaseService.getClient()
          .from('analytics_daily_metrics')
          .upsert({
            platform,
            source,
            metric_date: report.date,
            new_subscriptions: report.newSubscriptions,
            active_subscriptions: report.activeSubscriptions,
            churned_subscriptions: report.cancellations,
            subscription_revenue_cents: Math.round(report.revenue * 100),
            currency: report.currency,
            raw_data: report,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,source,metric_date',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: report, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveInstallsReports(reports: any[], source: string): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const report of reports) {
      try {
        await this.supabaseService.getClient()
          .from('analytics_daily_metrics')
          .upsert({
            platform: 'android',
            source,
            metric_date: report.date,
            installs: report.installs,
            uninstalls: report.uninstalls,
            active_users: report.activeDeviceInstalls,
            raw_data: report,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,source,metric_date',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: report, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveReviews(reviews: any[], platform: string, source: string): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const review of reviews) {
      try {
        await this.supabaseService.getClient()
          .from('analytics_reviews')
          .upsert({
            platform,
            source,
            review_id: review.id,
            rating: review.rating,
            title: review.title,
            review_text: review.body,
            reviewer_name: review.reviewerNickname,
            review_date: review.createdDate,
            modified_date: review.modifiedDate,
            raw_data: review,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,review_id',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: review, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveGoogleReviews(reviews: any[]): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const review of reviews) {
      try {
        const comment = review.comments?.[0]?.userComment;
        if (!comment) continue;

        await this.supabaseService.getClient()
          .from('analytics_reviews')
          .upsert({
            platform: 'android',
            source: 'google',
            review_id: review.reviewId,
            rating: comment.starRating,
            review_text: comment.text,
            reviewer_name: review.authorName,
            app_version: comment.appVersionName,
            review_date: new Date(parseInt(comment.lastModified.seconds) * 1000).toISOString(),
            developer_response: review.comments[0]?.developerComment?.text,
            developer_response_date: review.comments[0]?.developerComment?.lastModified
              ? new Date(parseInt(review.comments[0].developerComment.lastModified.seconds) * 1000).toISOString()
              : null,
            raw_data: review,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,review_id',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: review, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveCrashReports(crashes: any[], platform: string, source: string): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const crash of crashes) {
      try {
        await this.supabaseService.getClient()
          .from('analytics_crashes')
          .upsert({
            platform,
            source,
            crash_id: crash.crashId,
            crash_type: 'crash',
            error_message: crash.errorMessage,
            stack_trace: crash.stackTrace,
            exception_type: crash.errorType,
            app_version: crash.appVersion,
            os_version: crash.osVersion,
            device_model: crash.deviceType,
            occurrence_count: crash.crashCount,
            affected_users: crash.affectedUsers,
            first_occurred_at: crash.firstOccurrence,
            last_occurred_at: crash.lastOccurrence,
            crash_date: new Date(crash.firstOccurrence).toISOString().split('T')[0],
            raw_data: crash,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,crash_id,app_version',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: crash, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveGoogleCrashReports(crashes: any[]): Promise<{ synced: number; failed: number; errors: any[] }> {
    return this.saveCrashReports(
      crashes.map(c => ({
        crashId: c.crashId,
        errorMessage: c.exceptionMessage,
        stackTrace: c.stackTrace,
        errorType: c.exceptionType,
        appVersion: c.appVersionName,
        osVersion: c.osVersion,
        deviceType: c.deviceModel,
        crashCount: c.crashCount,
        affectedUsers: c.affectedUsers,
        firstOccurrence: c.firstOccurrence,
        lastOccurrence: c.lastOccurrence,
      })),
      'android',
      'google',
    );
  }

  private async saveGoogleANRReports(anrs: any[]): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const anr of anrs) {
      try {
        await this.supabaseService.getClient()
          .from('analytics_crashes')
          .upsert({
            platform: 'android',
            source: 'google',
            crash_id: anr.anrId,
            crash_type: 'anr',
            stack_trace: anr.stackTrace,
            app_version: anr.appVersionName,
            os_version: anr.osVersion,
            device_model: anr.deviceModel,
            occurrence_count: anr.anrCount,
            affected_users: anr.affectedUsers,
            first_occurred_at: anr.firstOccurrence,
            last_occurred_at: anr.lastOccurrence,
            crash_date: new Date(anr.firstOccurrence).toISOString().split('T')[0],
            raw_data: anr,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,crash_id,app_version',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: anr, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveFirebaseMetrics(metrics: any[], retentionData: any[]): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    // Create retention lookup
    const retentionMap = new Map();
    retentionData.forEach(r => {
      const key = `${r.cohortDate.toISOString().split('T')[0]}-${r.platform}`;
      retentionMap.set(key, r);
    });

    for (const metric of metrics) {
      try {
        const dateKey = `${metric.date.toISOString().split('T')[0]}-${metric.platform}`;
        const retention = retentionMap.get(dateKey);

        await this.supabaseService.getClient()
          .from('analytics_daily_metrics')
          .upsert({
            platform: metric.platform,
            source: 'firebase',
            metric_date: metric.date.toISOString().split('T')[0],
            active_users: metric.activeUsers,
            new_users: metric.newUsers,
            dau: metric.activeUsers,
            sessions: metric.sessions,
            avg_session_duration_secs: metric.avgSessionDuration,
            screen_views: metric.screenViews,
            retention_day_1: retention?.day1Retention || 0,
            retention_day_7: retention?.day7Retention || 0,
            retention_day_30: retention?.day30Retention || 0,
            raw_data: metric as any,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,source,metric_date',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: metric, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  private async saveCustomEvents(events: any[]): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const event of events) {
      try {
        await this.supabaseService.getClient()
          .from('analytics_events')
          .upsert({
            platform: event.platform,
            event_name: event.eventName,
            event_count: event.eventCount,
            unique_users: event.uniqueUsers,
            event_date: event.eventDate,
            event_params: event.eventParams,
            raw_data: event,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,event_name,event_date',
          });
        synced++;
      } catch (error) {
        failed++;
        errors.push({ record: event, error: error.message });
      }
    }

    return { synced, failed, errors };
  }

  // =====================================================
  // SYNC STATUS TRACKING
  // =====================================================

  private async createSyncStatus(source: string, syncType: string): Promise<string> {
    const { data, error } = await this.supabaseService.getClient()
      .from('analytics_sync_status')
      .insert({
        source,
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  private async completeSyncStatus(
    id: string,
    status: string,
    recordsSynced: number,
    recordsFailed: number,
    durationSeconds: number,
    errorMessage?: string,
  ): Promise<void> {
    await this.supabaseService.getClient()
      .from('analytics_sync_status')
      .update({
        status,
        records_synced: recordsSynced,
        records_failed: recordsFailed,
        duration_seconds: durationSeconds,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  // =====================================================
  // CONFIG HELPERS
  // =====================================================

  private getAppleConfig(): AppleAuthConfig {
    return {
      keyId: this.configService.get<string>('APPLE_KEY_ID') || '',
      issuerId: this.configService.get<string>('APPLE_ISSUER_ID') || '',
      privateKey: this.configService.get<string>('APPLE_PRIVATE_KEY') || '',
      bundleId: this.configService.get<string>('APPLE_BUNDLE_ID') || '',
    };
  }

  private getGoogleConfig(): GoogleAuthConfig {
    return {
      clientEmail: this.configService.get<string>('GOOGLE_CLIENT_EMAIL') || '',
      privateKey: this.configService.get<string>('GOOGLE_PRIVATE_KEY') || '',
      packageName: this.configService.get<string>('GOOGLE_PACKAGE_NAME') || '',
    };
  }

  private getFirebaseConfig(): FirebaseConfig {
    return {
      projectId: this.configService.get<string>('FIREBASE_PROPERTY_ID') || this.configService.get<string>('FIREBASE_PROJECT_ID') || '',
      clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL') || '',
      privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY') || '',
    };
  }
}
