import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { google } from 'googleapis';
import {
  GoogleAuthConfig,
  GoogleInstallsReport,
  GoogleSubscriptionReport,
  GoogleReview,
  GoogleCrashReport,
  GoogleANRReport,
  GoogleAPIError,
  DateRange,
} from '../../types/analytics.types';

/**
 * Google Play Developer API Service
 * Fetches analytics data from Google Play Console
 * 
 * Documentation: https://developers.google.com/android-publisher
 */
@Injectable()
export class GooglePlayService {
  private readonly logger = new Logger(GooglePlayService.name);
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
    });

    this.setupRetryInterceptor();
  }

  /**
   * Get authenticated Google API client
   */
  private async getAuthClient(config: GoogleAuthConfig) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: config.clientEmail,
          private_key: config.privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      return await auth.getClient();
    } catch (error) {
      this.logger.error(`Failed to create Google auth client: ${error.message}`);
      throw new GoogleAPIError('Authentication failed', 'AUTH_ERROR', error);
    }
  }

  /**
   * Fetch installs and uninstalls data
   */
  async fetchInstallsReports(
    config: GoogleAuthConfig,
    dateRange: DateRange,
  ): Promise<GoogleInstallsReport[]> {
    try {
      this.logger.log(`Fetching Google Play installs from ${dateRange.startDate} to ${dateRange.endDate}`);

      const authClient = await this.getAuthClient(config);
      const androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: authClient as any,
      });

      // Note: Google Play Console API has limited public endpoints
      // For production, you may need to use Google Play Console Reports API
      // or Cloud Storage bucket exports
      this.logger.warn('Google Play installs API requires additional setup');

      return [];
    } catch (error) {
      this.handleApiError(error, 'fetchInstallsReports');
      throw error;
    }
  }

  /**
   * Fetch subscription data
   */
  async fetchSubscriptionReports(
    config: GoogleAuthConfig,
    dateRange: DateRange,
  ): Promise<GoogleSubscriptionReport[]> {
    try {
      this.logger.log(`Fetching Google Play subscriptions from ${dateRange.startDate} to ${dateRange.endDate}`);

      const authClient = await this.getAuthClient(config);
      const androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: authClient as any,
      });

      // Note: Google Play Console API has limited public endpoints for listing subscriptions
      // For production, you need to process RTDN (Real-time developer notifications) or use Cloud Storage exports
      this.logger.warn('Google Play subscriptions API requires additional setup (RTDN or Reports API)');

      return [];
    } catch (error) {
      this.handleApiError(error, 'fetchSubscriptionReports');
      throw error;
    }
  }

  /**
   * Fetch app reviews
   */
  async fetchReviews(
    config: GoogleAuthConfig,
    maxResults: number = 100,
  ): Promise<GoogleReview[]> {
    try {
      this.logger.log(`Fetching Google Play reviews for ${config.packageName}`);

      const authClient = await this.getAuthClient(config);
      const androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: authClient as any,
      });

      const response = await androidPublisher.reviews.list({
        packageName: config.packageName,
        maxResults,
        translationLanguage: 'en',
      });

      return this.parseReviews(response.data);
    } catch (error) {
      this.handleApiError(error, 'fetchReviews');
      throw error;
    }
  }

  /**
   * Fetch crash reports
   */
  async fetchCrashReports(
    config: GoogleAuthConfig,
    dateRange: DateRange,
  ): Promise<GoogleCrashReport[]> {
    try {
      this.logger.log(`Fetching Google Play crash reports`);

      // Note: Crash data is typically accessed via Google Play Console API or Firebase Crashlytics
      // This uses the Play Console API's error reports endpoint
      const authClient = await this.getAuthClient(config);
      const accessToken = await authClient.getAccessToken();

      const response = await this.axiosInstance.get(
        `https://playconsole.googleapis.com/v1/apps/${config.packageName}/errorReports`,
        {
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
          },
          params: {
            startTime: dateRange.startDate.toISOString(),
            endTime: dateRange.endDate.toISOString(),
            errorType: 'CRASH',
          },
        },
      );

      return this.parseCrashReports(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.warn('No Google crash data available');
        return [];
      }
      this.handleApiError(error, 'fetchCrashReports');
      throw error;
    }
  }

  /**
   * Fetch ANR (Application Not Responding) reports
   */
  async fetchANRReports(
    config: GoogleAuthConfig,
    dateRange: DateRange,
  ): Promise<GoogleANRReport[]> {
    try {
      this.logger.log(`Fetching Google Play ANR reports`);

      const authClient = await this.getAuthClient(config);
      const accessToken = await authClient.getAccessToken();

      const response = await this.axiosInstance.get(
        `https://playconsole.googleapis.com/v1/apps/${config.packageName}/errorReports`,
        {
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
          },
          params: {
            startTime: dateRange.startDate.toISOString(),
            endTime: dateRange.endDate.toISOString(),
            errorType: 'ANR',
          },
        },
      );

      return this.parseANRReports(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.warn('No Google ANR data available');
        return [];
      }
      this.handleApiError(error, 'fetchANRReports');
      throw error;
    }
  }

  /**
   * Fetch financial data (revenue)
   */
  async fetchFinancialReports(
    config: GoogleAuthConfig,
    dateRange: DateRange,
  ): Promise<any[]> {
    try {
      this.logger.log(`Fetching Google Play financial reports`);

      const authClient = await this.getAuthClient(config);
      const androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: authClient as any,
      });

      // Note: Financial data requires special permissions
      // This is a simplified version
      const response = await androidPublisher.orders.refund({
        packageName: config.packageName,
        orderId: '', // Would iterate through orders
      });

      return [];
    } catch (error) {
      this.handleApiError(error, 'fetchFinancialReports');
      throw error;
    }
  }

  /**
   * Parse installs reports
   */
  private parseInstallsReports(data: any): GoogleInstallsReport[] {
    if (!data?.rows) return [];

    const reportsByDate = new Map<string, GoogleInstallsReport>();

    data.rows.forEach((row: any) => {
      const date = row.dimensions?.date || new Date().toISOString().split('T')[0];
      const country = row.dimensions?.country || 'UNKNOWN';

      const key = `${date}-${country}`;
      const existing = reportsByDate.get(key);

      const installs = parseInt(row.metrics?.installEvents) || 0;
      const uninstalls = parseInt(row.metrics?.uninstallEvents) || 0;
      const activeDeviceInstalls = parseInt(row.metrics?.activeDeviceInstalls) || 0;

      if (existing) {
        existing.installs += installs;
        existing.uninstalls += uninstalls;
        existing.activeDeviceInstalls += activeDeviceInstalls;
      } else {
        reportsByDate.set(key, {
          date: new Date(date),
          installs,
          uninstalls,
          activeDeviceInstalls,
          country,
        });
      }
    });

    return Array.from(reportsByDate.values());
  }

  /**
   * Parse subscription reports
   */
  private parseSubscriptionReports(
    data: any,
    dateRange: DateRange,
  ): GoogleSubscriptionReport[] {
    if (!data?.subscriptions) return [];

    const reportsByDate = new Map<string, GoogleSubscriptionReport>();

    data.subscriptions.forEach((sub: any) => {
      const startTime = new Date(sub.startTime);
      const dateKey = startTime.toISOString().split('T')[0];

      if (startTime >= dateRange.startDate && startTime <= dateRange.endDate) {
        const existing = reportsByDate.get(dateKey);

        if (existing) {
          existing.newSubscriptions += 1;
          if (sub.lineItems?.[0]?.productId) {
            existing.activeSubscriptions += 1;
          }
        } else {
          reportsByDate.set(dateKey, {
            date: startTime,
            activeSubscriptions: 1,
            newSubscriptions: 1,
            cancellations: 0,
            revenue: 0,
            currency: 'USD',
          });
        }
      }
    });

    return Array.from(reportsByDate.values());
  }

  /**
   * Parse reviews
   */
  private parseReviews(data: any): GoogleReview[] {
    if (!data?.reviews) return [];

    return data.reviews.map((review: any) => ({
      reviewId: review.reviewId,
      authorName: review.authorName,
      comments: review.comments || [],
    }));
  }

  /**
   * Parse crash reports
   */
  private parseCrashReports(data: any): GoogleCrashReport[] {
    if (!data?.errorReports) return [];

    return data.errorReports.map((crash: any) => ({
      crashId: crash.errorId,
      appVersionCode: crash.versionCode,
      appVersionName: crash.versionName,
      osVersion: crash.osVersion,
      deviceModel: crash.deviceModel,
      crashCount: crash.count || 1,
      affectedUsers: crash.distinctUsers || 0,
      exceptionType: crash.exceptionType,
      exceptionMessage: crash.exceptionMessage,
      stackTrace: crash.stackTrace || '',
      firstOccurrence: crash.firstOccurrenceTime,
      lastOccurrence: crash.lastOccurrenceTime,
    }));
  }

  /**
   * Parse ANR reports
   */
  private parseANRReports(data: any): GoogleANRReport[] {
    if (!data?.errorReports) return [];

    return data.errorReports.map((anr: any) => ({
      anrId: anr.errorId,
      appVersionCode: anr.versionCode,
      appVersionName: anr.versionName,
      osVersion: anr.osVersion,
      deviceModel: anr.deviceModel,
      anrCount: anr.count || 1,
      affectedUsers: anr.distinctUsers || 0,
      anrType: anr.anrType || 'UNKNOWN',
      stackTrace: anr.stackTrace || '',
      firstOccurrence: anr.firstOccurrenceTime,
      lastOccurrence: anr.lastOccurrenceTime,
    }));
  }

  /**
   * Setup retry interceptor
   */
  private setupRetryInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        if (!config || config.__retryCount >= 3) {
          return Promise.reject(error);
        }

        config.__retryCount = config.__retryCount || 0;
        config.__retryCount += 1;

        if (error.response?.status === 429 || error.response?.status >= 500) {
          const delay = this.getRetryDelay(config.__retryCount);
          this.logger.warn(`Retrying Google API request after ${delay}ms (attempt ${config.__retryCount})`);
          await this.sleep(delay);
          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Calculate retry delay
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any, operation: string): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      this.logger.error(`Google Play API error in ${operation}: ${status} - ${message}`);

      if (status === 401) {
        throw new GoogleAPIError('Authentication failed', 'AUTH_FAILED', error);
      } else if (status === 403) {
        throw new GoogleAPIError('Access forbidden', 'FORBIDDEN', error);
      } else if (status === 429) {
        throw new GoogleAPIError('Rate limit exceeded', 'RATE_LIMIT', error);
      } else {
        throw new GoogleAPIError(`API request failed: ${message}`, 'API_ERROR', error);
      }
    } else if (error.code) {
      this.logger.error(`Google API error in ${operation}: ${error.code} - ${error.message}`);
      throw new GoogleAPIError(error.message, error.code, error);
    } else {
      this.logger.error(`Unexpected error in ${operation}: ${error.message}`);
      throw new GoogleAPIError('Unexpected error occurred', 'UNKNOWN_ERROR', error);
    }
  }

  /**
   * Format date for API
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
