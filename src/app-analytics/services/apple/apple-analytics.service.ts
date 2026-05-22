import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as zlib from 'zlib';
import { AppleAuthService } from './apple-auth.service';
import {
  AppleAuthConfig,
  AppleSalesReport,
  AppleSubscriptionReport,
  AppleReview,
  AppleCrashReport,
  AppleAPIError,
  DateRange,
} from '../../types/analytics.types';

/**
 * Apple App Store Connect Analytics Service
 * Fetches analytics data from Apple App Store Connect API
 * 
 * Documentation: https://developer.apple.com/documentation/appstoreconnectapi
 */
@Injectable()
export class AppleAnalyticsService {
  private readonly logger = new Logger(AppleAnalyticsService.name);
  private readonly baseUrl = 'https://api.appstoreconnect.apple.com/v1';
  private axiosInstance: AxiosInstance;

  constructor(private readonly appleAuthService: AppleAuthService) {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    // Add retry interceptor
    this.setupRetryInterceptor();
  }

  /**
   * Fetch sales and trends reports (downloads, revenue)
   */
  async fetchSalesReports(
    config: AppleAuthConfig,
    dateRange: DateRange,
  ): Promise<AppleSalesReport[]> {
    try {
      this.logger.log(`Fetching Apple sales reports from ${dateRange.startDate} to ${dateRange.endDate}`);

      const headers = await this.appleAuthService.getAuthHeaders(config);

      // Apple Sales and Trends API endpoint
      // Note: This requires additional setup in App Store Connect
      const vendorNumber = await this.getVendorNumber(config);

      const reports: AppleSalesReport[] = [];

      // Fetch reports for each day in the range
      const currentDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      while (currentDate <= endDate) {
        const reportDate = currentDate.toISOString().split('T')[0];

        try {
          this.logger.debug({
            reportType: 'SALES',
            reportSubType: 'SUMMARY',
            frequency: 'DAILY',
            version: '1_0',
            reportDate,
            vendorNumber,
          });

          const response = await this.axiosInstance.get('/v1/salesReports', {
            headers,
            params: {
              'filter[frequency]': 'DAILY',
              'filter[reportDate]': reportDate,
              'filter[reportSubType]': 'SUMMARY',
              'filter[reportType]': 'SALES',
              'filter[vendorNumber]': vendorNumber,
              'filter[version]': '1_0',
            },
          });

          if (response.data) {
            const dailyReports = this.parseSalesReports(response.data);
            reports.push(...dailyReports);
          }
        } catch (error) {
          if (this.isNoDataError(error)) {
            // Apple returns 404 when no report exists for the requested date.
            // This is expected for apps with low/no sales or recent launch dates.
            this.logger.warn(`No Apple SALES report available for ${reportDate}`);
          } else {
            const status = error?.response?.status;
            if (status === 401 || status === 403 || status === 429 || status >= 500) {
              throw error;
            } else {
              this.logger.warn(`Failed to fetch sales report for ${reportDate}: ${error.message}`);
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.logger.log(`Fetched ${reports.length} sales reports`);
      return reports;
    } catch (error) {
      this.handleApiError(error, 'fetchSalesReports');
      throw error;
    }
  }

  /**
   * Get vendor number from App Store Connect
   */
  private async getVendorNumber(config: AppleAuthConfig): Promise<string> {
    const vendorNumber = process.env.APPLE_VENDOR_NUMBER;

    if (!vendorNumber) {
      this.logger.error('Missing vendor number: APPLE_VENDOR_NUMBER environment variable is required');
      throw new AppleAPIError('APPLE_VENDOR_NUMBER environment variable is required', 'MISSING_VENDOR_NUMBER');
    }

    return vendorNumber;
  }

  /**
   * Fetch subscription reports
   */
  async fetchSubscriptionReports(
    config: AppleAuthConfig,
    dateRange: DateRange,
  ): Promise<AppleSubscriptionReport[]> {
    try {
      this.logger.log(`Fetching Apple subscription reports from ${dateRange.startDate} to ${dateRange.endDate}`);

      const headers = await this.appleAuthService.getAuthHeaders(config);
      const vendorNumber = await this.getVendorNumber(config);
      
      const reports: AppleSubscriptionReport[] = [];
      
      // Fetch reports for each day in the range
      const currentDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      while (currentDate <= endDate) {
        const reportDate = currentDate.toISOString().split('T')[0];
        
        try {
          this.logger.debug({
            reportType: 'SUBSCRIPTION',
            reportSubType: 'SUMMARY',
            frequency: 'DAILY',
            version: '1_3',
            reportDate,
            vendorNumber,
          });

          const response = await this.axiosInstance.get('/v1/salesReports', {
            headers,
            responseType: 'arraybuffer',
            params: {
              'filter[frequency]': 'DAILY',
              'filter[reportDate]': reportDate,
              'filter[reportSubType]': 'SUMMARY',
              'filter[reportType]': 'SUBSCRIPTION',
              'filter[vendorNumber]': vendorNumber,
              'filter[version]': '1_3',
            },
          });

          if (response.data) {
            let decompressedData: string;
            try {
              decompressedData = zlib.gunzipSync(response.data).toString('utf-8');
            } catch (decompError) {
              decompressedData = response.data.toString('utf-8');
            }
            const dailyReports = this.parseSubscriptionReports(decompressedData);
            reports.push(...dailyReports);
          }
        } catch (error) {
          if (this.isNoDataError(error)) {
            // Apple returns 404 when no report exists for the requested date.
            // This is expected for apps with low/no sales or recent launch dates.
            this.logger.warn(`No Apple SUBSCRIPTION report available for ${reportDate}`);
          } else {
            const status = error?.response?.status;
            if (status === 401 || status === 403 || status === 429 || status >= 500) {
              throw error;
            } else {
              this.logger.warn(`Failed to fetch subscription report for ${reportDate}: ${error.message}`);
            }
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.logger.log(`Fetched ${reports.length} subscription reports`);
      return reports;
    } catch (error) {
      this.handleApiError(error, 'fetchSubscriptionReports');
      throw error;
    }
  }

  /**
   * Fetch app reviews
   */
  async fetchReviews(
    config: AppleAuthConfig,
    appId: string,
    limit: number = 100,
  ): Promise<AppleReview[]> {
    try {
      this.logger.log(`Fetching Apple reviews for app ${appId}`);

      const headers = await this.appleAuthService.getAuthHeaders(config);

      const response = await this.axiosInstance.get(`/apps/${appId}/customerReviews`, {
        headers,
        params: {
          'limit': limit,
          'sort': '-createdDate',
          'include': 'response',
        },
      });

      return this.parseReviews(response.data);
    } catch (error) {
      this.handleApiError(error, 'fetchReviews');
      throw error;
    }
  }



  /**
   * Fetch app analytics metrics (downloads, sessions, etc.)
   */
  async fetchAnalyticsMetrics(
    config: AppleAuthConfig,
    appId: string,
    dateRange: DateRange,
    metrics: string[] = ['installs', 'sessions', 'activeDevices'],
  ): Promise<any> {
    try {
      this.logger.log(`Fetching Apple analytics metrics for app ${appId}`);

      const headers = await this.appleAuthService.getAuthHeaders(config);

      const response = await this.axiosInstance.post(
        `/analyticsReportRequests`,
        {
          data: {
            type: 'analyticsReportRequests',
            attributes: {
              accessType: 'ONGOING',
              app: appId,
            },
            relationships: {
              app: {
                data: {
                  type: 'apps',
                  id: appId,
                },
              },
            },
          },
        },
        { headers },
      );

      // Poll for report completion
      const reportId = response.data.data.id;
      return await this.pollAnalyticsReport(config, reportId);
    } catch (error) {
      this.handleApiError(error, 'fetchAnalyticsMetrics');
      throw error;
    }
  }

  /**
   * Poll analytics report until ready
   */
  private async pollAnalyticsReport(
    config: AppleAuthConfig,
    reportId: string,
    maxAttempts: number = 10,
  ): Promise<any> {
    const headers = await this.appleAuthService.getAuthHeaders(config);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.axiosInstance.get(`/analyticsReportRequests/${reportId}`, {
        headers,
      });

      const status = response.data.data.attributes.status;

      if (status === 'COMPLETED') {
        // Fetch the actual report data
        const reportUrl = response.data.data.attributes.downloadUrl;
        const reportData = await axios.get(reportUrl);
        return reportData.data;
      } else if (status === 'FAILED') {
        throw new AppleAPIError('Analytics report generation failed', 'REPORT_FAILED');
      }

      // Wait before next poll
      await this.sleep(5000);
    }

    throw new AppleAPIError('Analytics report polling timeout', 'POLL_TIMEOUT');
  }

  /**
   * Parse sales reports from API response
   */
  private parseSalesReports(data: any): AppleSalesReport[] {
    // Apple returns TSV data, parse it
    if (!data) return [];

    const reports: AppleSalesReport[] = [];
    const lines = data.split('\n');

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split('\t');
      reports.push({
        date: new Date(fields[9]), // Report date
        downloads: parseInt(fields[7]) || 0, // Units
        updates: parseInt(fields[8]) || 0,
        proceeds: parseFloat(fields[10]) || 0,
        currency: fields[13] || 'USD',
        country: fields[14] || 'US',
        productType: fields[6] || 'App',
      });
    }

    return reports;
  }

  /**
   * Parse subscription reports
   */
  private parseSubscriptionReports(data: any): AppleSubscriptionReport[] {
    if (!data) return [];

    const reports: AppleSubscriptionReport[] = [];
    const lines = data.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split('\t');
      reports.push({
        date: new Date(fields[0]),
        activeSubscriptions: parseInt(fields[1]) || 0,
        newSubscriptions: parseInt(fields[2]) || 0,
        renewals: parseInt(fields[3]) || 0,
        cancellations: parseInt(fields[4]) || 0,
        revenue: parseFloat(fields[5]) || 0,
        currency: fields[6] || 'USD',
      });
    }

    return reports;
  }

  /**
   * Parse reviews from API response
   */
  private parseReviews(data: any): AppleReview[] {
    if (!data?.data) return [];

    return data.data.map((review: any) => ({
      id: review.id,
      rating: review.attributes.rating,
      title: review.attributes.title,
      body: review.attributes.body,
      reviewerNickname: review.attributes.reviewerNickname,
      territory: review.attributes.territory,
      createdDate: review.attributes.createdDate,
      modifiedDate: review.attributes.modifiedDate,
    }));
  }

  /**
   * Parse crash reports
   */
  private parseCrashReports(data: any): AppleCrashReport[] {
    if (!data?.data) return [];

    return data.data.map((crash: any) => ({
      crashId: crash.id,
      appVersion: crash.attributes.bundleShortVersion,
      osVersion: crash.attributes.platformVersion,
      deviceType: crash.attributes.deviceType,
      crashCount: crash.attributes.crashCount,
      affectedUsers: crash.attributes.impactedDevicesCount,
      errorType: crash.attributes.signature,
      errorMessage: crash.attributes.errorMessage || '',
      stackTrace: crash.attributes.stackTrace || '',
      firstOccurrence: crash.attributes.firstOccurrence,
      lastOccurrence: crash.attributes.lastOccurrence,
    }));
  }

  /**
   * Setup retry interceptor for failed requests
   */
  private setupRetryInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        // Don't retry if we've already retried
        if (!config || config.__retryCount >= 3) {
          return Promise.reject(error);
        }

        config.__retryCount = config.__retryCount || 0;
        config.__retryCount += 1;

        // Retry on rate limit or server errors
        if (error.response?.status === 429 || error.response?.status >= 500) {
          const delay = this.getRetryDelay(config.__retryCount, error.response?.headers);
          this.logger.warn(`Retrying Apple API request after ${delay}ms (attempt ${config.__retryCount})`);
          await this.sleep(delay);
          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(retryCount: number, headers?: any): number {
    // Check for Retry-After header
    if (headers?.['retry-after']) {
      return parseInt(headers['retry-after']) * 1000;
    }

    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any, operation: string): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.errors?.[0]?.detail || error.message;

      this.logger.error(`Apple API error in ${operation}: ${status} - ${message}`);

      if (status === 401) {
        throw new AppleAPIError('Authentication failed. Check your API credentials.', 'AUTH_FAILED', error);
      } else if (status === 403) {
        throw new AppleAPIError('Access forbidden. Check your API permissions.', 'FORBIDDEN', error);
      } else if (status === 429) {
        throw new AppleAPIError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT', error);
      } else {
        throw new AppleAPIError(`API request failed: ${message}`, 'API_ERROR', error);
      }
    } else {
      this.logger.error(`Unexpected error in ${operation}: ${error.message}`);
      throw new AppleAPIError('Unexpected error occurred', 'UNKNOWN_ERROR', error);
    }
  }

  /**
   * Format date range for API requests
   */
  private formatDateRange(dateRange: DateRange): string {
    const start = dateRange.startDate.toISOString().split('T')[0];
    const end = dateRange.endDate.toISOString().split('T')[0];
    return `${start},${end}`;
  }

  /**
   * Check if error is a 404 response indicating no data available
   */
  private isNoDataError(error: any): boolean {
    return error?.response?.status === 404;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
