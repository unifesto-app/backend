import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsSyncService } from '../services/analytics-sync.service';

/**
 * Analytics Sync Scheduler
 * Runs periodic sync jobs for analytics data
 */
@Injectable()
export class AnalyticsSyncScheduler {
  private readonly logger = new Logger(AnalyticsSyncScheduler.name);
  private isSyncing = false;

  constructor(private readonly analyticsSyncService: AnalyticsSyncService) {}

  /**
   * Sync Apple and Google analytics every hour
   * Runs at the top of every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncHourly() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping hourly sync');
      return;
    }

    try {
      this.isSyncing = true;
      this.logger.log('Starting hourly analytics sync');

      const dateRange = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date(),
      };

      // Sync Apple and Google in parallel
      await Promise.allSettled([
        this.analyticsSyncService.syncAppleAnalytics(dateRange),
        this.analyticsSyncService.syncGoogleAnalytics(dateRange),
      ]);

      this.logger.log('Hourly analytics sync completed');
    } catch (error) {
      this.logger.error(`Error in hourly sync: ${error.message}`, error.stack);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync Firebase analytics daily
   * Runs at 2 AM every day
   */
  @Cron('0 2 * * *')
  async syncDaily() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping daily sync');
      return;
    }

    try {
      this.isSyncing = true;
      this.logger.log('Starting daily Firebase analytics sync');

      const dateRange = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        endDate: new Date(),
      };

      await this.analyticsSyncService.syncFirebaseAnalytics(dateRange);

      this.logger.log('Daily Firebase analytics sync completed');
    } catch (error) {
      this.logger.error(`Error in daily sync: ${error.message}`, error.stack);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Full sync weekly
   * Runs at 3 AM every Sunday
   */
  @Cron('0 3 * * 0')
  async syncWeekly() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping weekly sync');
      return;
    }

    try {
      this.isSyncing = true;
      this.logger.log('Starting weekly full analytics sync');

      await this.analyticsSyncService.syncAll();

      this.logger.log('Weekly full analytics sync completed');
    } catch (error) {
      this.logger.error(`Error in weekly sync: ${error.message}`, error.stack);
    } finally {
      this.isSyncing = false;
    }
  }
}
