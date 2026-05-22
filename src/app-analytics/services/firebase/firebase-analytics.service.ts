import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { google } from 'googleapis';
import {
  FirebaseConfig,
  FirebaseAnalyticsReport,
  FirebaseRetentionReport,
  FirebaseEvent,
  FirebaseAPIError,
  DateRange,
  Platform,
} from '../../types/analytics.types';

/**
 * Firebase Analytics Service
 * Fetches analytics data from Firebase/Google Analytics
 * 
 * Documentation: https://firebase.google.com/docs/analytics
 * API: https://developers.google.com/analytics/devguides/reporting/data/v1
 */
@Injectable()
export class FirebaseAnalyticsService {
  private readonly logger = new Logger(FirebaseAnalyticsService.name);
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
    });
  }

  /**
   * Get authenticated Google Analytics Data API client
   */
  private async getAuthClient(config: FirebaseConfig) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: config.clientEmail,
          private_key: config.privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      });

      return await auth.getClient();
    } catch (error) {
      this.logger.error(`Failed to create Firebase auth client: ${error.message}`);
      throw new FirebaseAPIError('Authentication failed', 'AUTH_ERROR', error);
    }
  }

  /**
   * Fetch daily analytics metrics (DAU, MAU, sessions, etc.)
   */
  async fetchDailyMetrics(
    config: FirebaseConfig,
    dateRange: DateRange,
    platform?: Platform,
  ): Promise<FirebaseAnalyticsReport[]> {
    try {
      this.logger.log(`Fetching Firebase daily metrics from ${dateRange.startDate} to ${dateRange.endDate}`);

      const authClient = await this.getAuthClient(config);
      const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: authClient as any,
      });

      const propertyId = `properties/${config.projectId}`;

      // Build dimension filter for platform
      const dimensionFilter = platform
        ? {
          filter: {
            fieldName: 'platform',
            stringFilter: {
              value: this.mapPlatformToFirebase(platform),
            },
          },
        }
        : undefined;

      const response = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [
            {
              startDate: this.formatDate(dateRange.startDate),
              endDate: this.formatDate(dateRange.endDate),
            },
          ],
          dimensions: [
            { name: 'date' },
            { name: 'platform' },
          ],
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
            { name: 'screenPageViews' },
            { name: 'eventCount' },
          ],
          dimensionFilter,
        },
      });

      return this.parseDailyMetrics(response.data);
    } catch (error) {
      this.handleApiError(error, 'fetchDailyMetrics');
      throw error;
    }
  }

  /**
   * Fetch retention cohorts
   */
  async fetchRetentionCohorts(
    config: FirebaseConfig,
    dateRange: DateRange,
    platform?: Platform,
  ): Promise<FirebaseRetentionReport[]> {
    try {
      this.logger.log(`Fetching Firebase retention cohorts`);

      const authClient = await this.getAuthClient(config);
      const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: authClient as any,
      });

      const propertyId = `properties/${config.projectId}`;

      // Fetch cohort data for different retention periods using Promise.allSettled
      const results = await Promise.allSettled([
        this.fetchRetentionForPeriod(analyticsData, propertyId, dateRange, 1, platform),
        this.fetchRetentionForPeriod(analyticsData, propertyId, dateRange, 7, platform),
        this.fetchRetentionForPeriod(analyticsData, propertyId, dateRange, 30, platform),
      ]);

      const day1 = results[0].status === 'fulfilled' ? results[0].value : { days: 1, data: null };
      const day7 = results[1].status === 'fulfilled' ? results[1].value : { days: 7, data: null };
      const day30 = results[2].status === 'fulfilled' ? results[2].value : { days: 30, data: null };

      this.logger.log('Firebase cohort sync completed for all periods');

      return this.combineRetentionData(day1, day7, day30);
    } catch (error) {
      this.logger.error(`Firebase cohort sync failed: ${error.message}`);
      this.handleApiError(error, 'fetchRetentionCohorts');
      throw error;
    }
  }

  /**
   * Fetch custom events
   */
  async fetchCustomEvents(
    config: FirebaseConfig,
    dateRange: DateRange,
    eventNames?: string[],
    platform?: Platform,
  ): Promise<FirebaseEvent[]> {
    try {
      this.logger.log(`Fetching Firebase custom events`);

      const authClient = await this.getAuthClient(config);
      const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: authClient as any,
      });

      const propertyId = `properties/${config.projectId}`;

      // Build dimension filter
      const filters: any[] = [];
      if (platform) {
        filters.push({
          fieldName: 'platform',
          stringFilter: {
            value: this.mapPlatformToFirebase(platform),
          },
        });
      }
      if (eventNames && eventNames.length > 0) {
        filters.push({
          fieldName: 'eventName',
          inListFilter: {
            values: eventNames,
          },
        });
      }

      const dimensionFilter =
        filters.length > 0
          ? {
            andGroup: {
              expressions: filters.map((f) => ({ filter: f })),
            },
          }
          : undefined;

      const response = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [
            {
              startDate: this.formatDate(dateRange.startDate),
              endDate: this.formatDate(dateRange.endDate),
            },
          ],
          dimensions: [
            { name: 'date' },
            { name: 'eventName' },
            { name: 'platform' },
          ],
          metrics: [
            { name: 'eventCount' },
            { name: 'totalUsers' },
          ],
          dimensionFilter,
          limit: '1000',
        },
      });

      return this.parseCustomEvents(response.data);
    } catch (error) {
      this.handleApiError(error, 'fetchCustomEvents');
      throw error;
    }
  }

  /**
   * Fetch screen views
   */
  async fetchScreenViews(
    config: FirebaseConfig,
    dateRange: DateRange,
    platform?: Platform,
  ): Promise<any[]> {
    try {
      this.logger.log(`Fetching Firebase screen views`);

      const authClient = await this.getAuthClient(config);
      const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: authClient as any,
      });

      const propertyId = `properties/${config.projectId}`;

      const dimensionFilter = platform
        ? {
          filter: {
            fieldName: 'platform',
            stringFilter: {
              value: this.mapPlatformToFirebase(platform),
            },
          },
        }
        : undefined;

      const response = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [
            {
              startDate: this.formatDate(dateRange.startDate),
              endDate: this.formatDate(dateRange.endDate),
            },
          ],
          dimensions: [
            { name: 'date' },
            { name: 'screenName' },
            { name: 'platform' },
          ],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
          ],
          dimensionFilter,
          orderBys: [
            {
              metric: {
                metricName: 'screenPageViews',
              },
              desc: true,
            },
          ],
          limit: '100',
        },
      });

      return this.parseScreenViews(response.data);
    } catch (error) {
      this.handleApiError(error, 'fetchScreenViews');
      throw error;
    }
  }

  /**
   * Fetch engagement metrics
   */
  async fetchEngagementMetrics(
    config: FirebaseConfig,
    dateRange: DateRange,
    platform?: Platform,
  ): Promise<any> {
    try {
      this.logger.log(`Fetching Firebase engagement metrics`);

      const authClient = await this.getAuthClient(config);
      const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: authClient as any,
      });

      const propertyId = `properties/${config.projectId}`;

      const dimensionFilter = platform
        ? {
          filter: {
            fieldName: 'platform',
            stringFilter: {
              value: this.mapPlatformToFirebase(platform),
            },
          },
        }
        : undefined;

      const response = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [
            {
              startDate: this.formatDate(dateRange.startDate),
              endDate: this.formatDate(dateRange.endDate),
            },
          ],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'engagedSessions' },
            { name: 'engagementRate' },
            { name: 'userEngagementDuration' },
            { name: 'sessionsPerUser' },
          ],
          dimensionFilter,
        },
      });

      return this.parseEngagementMetrics(response.data);
    } catch (error) {
      this.handleApiError(error, 'fetchEngagementMetrics');
      throw error;
    }
  }

  /**
   * Fetch retention for specific period
   */
  private async fetchRetentionForPeriod(
    analyticsData: any,
    propertyId: string,
    dateRange: DateRange,
    days: number,
    platform?: Platform,
  ): Promise<any> {
    const dimensionFilter = platform
      ? {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            value: this.mapPlatformToFirebase(platform),
          },
        },
      }
      : undefined;

    this.logger.log(`Firebase cohort sync: fetching period for day ${days} using dimension: 'firstSessionDate'`);

    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: this.formatDate(dateRange.startDate),
            endDate: this.formatDate(dateRange.endDate),
          },
        ],
        dimensions: [
          { name: 'cohort' },
          { name: 'platform' },
        ],
        metrics: [
          { name: 'cohortActiveUsers' },
          { name: 'cohortTotalUsers' },
        ],
        cohortSpec: {
          cohorts: [
            {
              name: `Day ${days}`,
              dimension: 'firstSessionDate',
              dateRange: {
                startDate: this.formatDate(
                  new Date(dateRange.startDate.getTime() - days * 24 * 60 * 60 * 1000),
                ),
                endDate: this.formatDate(dateRange.startDate),
              },
            },
          ],
          cohortsRange: {
            granularity: 'DAILY',
            startOffset: 0,
            endOffset: days,
          },
        },
        dimensionFilter,
      },
    });

    return { days, data: response.data };
  }

  /**
   * Parse daily metrics
   */
  private parseDailyMetrics(data: any): FirebaseAnalyticsReport[] {
    if (!data?.rows) return [];

    return data.rows.map((row: any) => {
      const date = row.dimensionValues[0].value;
      const platform = this.mapFirebaseToPlatform(row.dimensionValues[1].value);

      return {
        date: new Date(date),
        platform,
        activeUsers: parseInt(row.metricValues[0].value) || 0,
        newUsers: parseInt(row.metricValues[1].value) || 0,
        sessions: parseInt(row.metricValues[2].value) || 0,
        avgSessionDuration: parseFloat(row.metricValues[3].value) || 0,
        screenViews: parseInt(row.metricValues[4].value) || 0,
        eventCount: parseInt(row.metricValues[5].value) || 0,
      };
    });
  }

  /**
   * Combine retention data
   */
  private combineRetentionData(day1: any, day7: any, day30: any): FirebaseRetentionReport[] {
    const reports = new Map<string, FirebaseRetentionReport>();

    // Process each retention period
    [day1, day7, day30].forEach((period) => {
      if (!period.data?.rows) return;

      period.data.rows.forEach((row: any) => {
        const date = row.dimensionValues[0].value;
        const platform = this.mapFirebaseToPlatform(row.dimensionValues[1].value);
        const key = `${date}-${platform}`;

        const activeUsers = parseInt(row.metricValues[0].value) || 0;
        const totalUsers = parseInt(row.metricValues[1].value) || 1;
        const retention = (activeUsers / totalUsers) * 100;

        const existing = reports.get(key);
        if (existing) {
          if (period.days === 1) existing.day1Retention = retention;
          if (period.days === 7) existing.day7Retention = retention;
          if (period.days === 30) existing.day30Retention = retention;
        } else {
          reports.set(key, {
            cohortDate: new Date(date),
            platform,
            day1Retention: period.days === 1 ? retention : 0,
            day7Retention: period.days === 7 ? retention : 0,
            day30Retention: period.days === 30 ? retention : 0,
          });
        }
      });
    });

    return Array.from(reports.values());
  }

  /**
   * Parse custom events
   */
  private parseCustomEvents(data: any): FirebaseEvent[] {
    if (!data?.rows) return [];

    return data.rows.map((row: any) => ({
      eventDate: new Date(row.dimensionValues[0].value),
      eventName: row.dimensionValues[1].value,
      platform: this.mapFirebaseToPlatform(row.dimensionValues[2].value),
      eventCount: parseInt(row.metricValues[0].value) || 0,
      uniqueUsers: parseInt(row.metricValues[1].value) || 0,
      eventParams: {},
    }));
  }

  /**
   * Parse screen views
   */
  private parseScreenViews(data: any): any[] {
    if (!data?.rows) return [];

    return data.rows.map((row: any) => ({
      date: new Date(row.dimensionValues[0].value),
      screenName: row.dimensionValues[1].value,
      platform: this.mapFirebaseToPlatform(row.dimensionValues[2].value),
      views: parseInt(row.metricValues[0].value) || 0,
      users: parseInt(row.metricValues[1].value) || 0,
    }));
  }

  /**
   * Parse engagement metrics
   */
  private parseEngagementMetrics(data: any): any {
    if (!data?.rows) return {};

    const metrics = {
      engagedSessions: 0,
      engagementRate: 0,
      avgEngagementDuration: 0,
      sessionsPerUser: 0,
    };

    data.rows.forEach((row: any) => {
      metrics.engagedSessions += parseInt(row.metricValues[0].value) || 0;
      metrics.engagementRate += parseFloat(row.metricValues[1].value) || 0;
      metrics.avgEngagementDuration += parseFloat(row.metricValues[2].value) || 0;
      metrics.sessionsPerUser += parseFloat(row.metricValues[3].value) || 0;
    });

    const rowCount = data.rows.length;
    if (rowCount > 0) {
      metrics.engagementRate /= rowCount;
      metrics.avgEngagementDuration /= rowCount;
      metrics.sessionsPerUser /= rowCount;
    }

    return metrics;
  }

  /**
   * Map platform to Firebase format
   */
  private mapPlatformToFirebase(platform: Platform): string {
    const mapping: Record<Platform, string> = {
      ios: 'iOS',
      android: 'Android',
      web: 'Web',
    };
    return mapping[platform] || platform;
  }

  /**
   * Map Firebase platform to our format
   */
  private mapFirebaseToPlatform(firebasePlatform: string): Platform {
    const mapping: Record<string, Platform> = {
      iOS: 'ios',
      Android: 'android',
      Web: 'web',
    };
    return mapping[firebasePlatform] || 'web';
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any, operation: string): void {
    if (error.code) {
      this.logger.error(`Firebase API error in ${operation}: ${error.code} - ${error.message}`);
      throw new FirebaseAPIError(error.message, error.code, error);
    } else {
      this.logger.error(`Unexpected error in ${operation}: ${error.message}`);
      throw new FirebaseAPIError('Unexpected error occurred', 'UNKNOWN_ERROR', error);
    }
  }

  /**
   * Format date for API
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
