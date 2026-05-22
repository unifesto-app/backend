import { Injectable, Logger } from '@nestjs/common';

/**
 * Analytics Validator Service
 * Validates and sanitizes analytics data before storage
 */
@Injectable()
export class AnalyticsValidatorService {
  private readonly logger = new Logger(AnalyticsValidatorService.name);

  /**
   * Validate daily metric data
   */
  validateDailyMetric(data: any): { valid: boolean; errors: string[]; sanitized?: any } {
    const errors: string[] = [];

    // Required fields
    if (!data.platform || !['ios', 'android'].includes(data.platform)) {
      errors.push('Invalid platform');
    }

    if (!data.source || !['apple', 'google', 'firebase'].includes(data.source)) {
      errors.push('Invalid source');
    }

    if (!data.metric_date || !this.isValidDate(data.metric_date)) {
      errors.push('Invalid metric_date');
    }

    // Validate numeric fields
    const numericFields = [
      'downloads',
      'installs',
      'active_users',
      'dau',
      'mau',
      'sessions',
      'revenue_cents',
      'crashes',
    ];

    numericFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (!this.isValidNumber(data[field]) || data[field] < 0) {
          errors.push(`Invalid ${field}: must be non-negative number`);
        }
      }
    });

    // Validate percentages
    const percentageFields = [
      'retention_day_1',
      'retention_day_7',
      'retention_day_30',
      'crash_free_users_percentage',
    ];

    percentageFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (!this.isValidPercentage(data[field])) {
          errors.push(`Invalid ${field}: must be between 0 and 100`);
        }
      }
    });

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Sanitize data
    const sanitized = {
      platform: data.platform,
      source: data.source,
      metric_date: this.sanitizeDate(data.metric_date),
      downloads: this.sanitizeNumber(data.downloads, 0),
      installs: this.sanitizeNumber(data.installs, 0),
      uninstalls: this.sanitizeNumber(data.uninstalls, 0),
      active_users: this.sanitizeNumber(data.active_users, 0),
      new_users: this.sanitizeNumber(data.new_users, 0),
      dau: this.sanitizeNumber(data.dau, 0),
      mau: this.sanitizeNumber(data.mau, 0),
      sessions: this.sanitizeNumber(data.sessions, 0),
      avg_session_duration_seconds: this.sanitizeNumber(data.avg_session_duration_seconds, 0),
      screen_views: this.sanitizeNumber(data.screen_views, 0),
      retention_day_1: this.sanitizePercentage(data.retention_day_1, 0),
      retention_day_7: this.sanitizePercentage(data.retention_day_7, 0),
      retention_day_30: this.sanitizePercentage(data.retention_day_30, 0),
      revenue_cents: this.sanitizeNumber(data.revenue_cents, 0),
      proceeds_cents: this.sanitizeNumber(data.proceeds_cents, 0),
      currency: this.sanitizeCurrency(data.currency),
      new_subscriptions: this.sanitizeNumber(data.new_subscriptions, 0),
      active_subscriptions: this.sanitizeNumber(data.active_subscriptions, 0),
      churned_subscriptions: this.sanitizeNumber(data.churned_subscriptions, 0),
      subscription_revenue_cents: this.sanitizeNumber(data.subscription_revenue_cents, 0),
      crashes: this.sanitizeNumber(data.crashes, 0),
      crash_free_users_percentage: this.sanitizePercentage(data.crash_free_users_percentage, 100),
      anr_count: this.sanitizeNumber(data.anr_count, 0),
      raw_data: data.raw_data,
      synced_at: new Date().toISOString(),
    };

    return { valid: true, errors: [], sanitized };
  }

  /**
   * Validate review data
   */
  validateReview(data: any): { valid: boolean; errors: string[]; sanitized?: any } {
    const errors: string[] = [];

    if (!data.platform || !['ios', 'android'].includes(data.platform)) {
      errors.push('Invalid platform');
    }

    if (!data.review_id) {
      errors.push('Missing review_id');
    }

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.push('Invalid rating: must be between 1 and 5');
    }

    if (!data.review_date || !this.isValidDate(data.review_date)) {
      errors.push('Invalid review_date');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const sanitized = {
      platform: data.platform,
      source: data.source || (data.platform === 'ios' ? 'apple' : 'google'),
      review_id: this.sanitizeString(data.review_id),
      rating: Math.round(data.rating),
      title: this.sanitizeString(data.title, 500),
      review_text: this.sanitizeString(data.review_text, 5000),
      reviewer_name: this.sanitizeString(data.reviewer_name, 255),
      reviewer_id: this.sanitizeString(data.reviewer_id, 255),
      app_version: this.sanitizeString(data.app_version, 50),
      developer_response: this.sanitizeString(data.developer_response, 5000),
      developer_response_date: data.developer_response_date
        ? this.sanitizeDate(data.developer_response_date)
        : null,
      review_date: this.sanitizeDate(data.review_date),
      modified_date: data.modified_date ? this.sanitizeDate(data.modified_date) : null,
      raw_data: data.raw_data,
      synced_at: new Date().toISOString(),
    };

    return { valid: true, errors: [], sanitized };
  }

  /**
   * Validate crash data
   */
  validateCrash(data: any): { valid: boolean; errors: string[]; sanitized?: any } {
    const errors: string[] = [];

    if (!data.platform || !['ios', 'android'].includes(data.platform)) {
      errors.push('Invalid platform');
    }

    if (!data.crash_type || !['crash', 'anr', 'exception'].includes(data.crash_type)) {
      errors.push('Invalid crash_type');
    }

    if (!data.app_version) {
      errors.push('Missing app_version');
    }

    if (!data.crash_date || !this.isValidDate(data.crash_date)) {
      errors.push('Invalid crash_date');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const sanitized = {
      platform: data.platform,
      source: data.source || (data.platform === 'ios' ? 'apple' : 'google'),
      crash_id: this.sanitizeString(data.crash_id, 255),
      crash_type: data.crash_type,
      error_message: this.sanitizeString(data.error_message, 1000),
      stack_trace: this.sanitizeString(data.stack_trace, 10000),
      exception_type: this.sanitizeString(data.exception_type, 255),
      app_version: this.sanitizeString(data.app_version, 50),
      os_version: this.sanitizeString(data.os_version, 50),
      device_model: this.sanitizeString(data.device_model, 100),
      occurrence_count: this.sanitizeNumber(data.occurrence_count, 1),
      affected_users: this.sanitizeNumber(data.affected_users, 0),
      first_occurred_at: this.sanitizeDate(data.first_occurred_at),
      last_occurred_at: this.sanitizeDate(data.last_occurred_at),
      crash_date: this.sanitizeDate(data.crash_date),
      status: data.status || 'open',
      raw_data: data.raw_data,
      synced_at: new Date().toISOString(),
    };

    return { valid: true, errors: [], sanitized };
  }

  /**
   * Helper: Check if valid date
   */
  private isValidDate(date: any): boolean {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  /**
   * Helper: Check if valid number
   */
  private isValidNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Helper: Check if valid percentage
   */
  private isValidPercentage(value: any): boolean {
    return this.isValidNumber(value) && value >= 0 && value <= 100;
  }

  /**
   * Helper: Sanitize number
   */
  private sanitizeNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return this.isValidNumber(num) && num >= 0 ? num : defaultValue;
  }

  /**
   * Helper: Sanitize percentage
   */
  private sanitizePercentage(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    if (!this.isValidNumber(num)) return defaultValue;
    return Math.max(0, Math.min(100, num));
  }

  /**
   * Helper: Sanitize string
   */
  private sanitizeString(value: any, maxLength?: number): string | null {
    if (value === null || value === undefined) return null;
    let str = String(value).trim();
    if (maxLength && str.length > maxLength) {
      str = str.substring(0, maxLength);
    }
    return str || null;
  }

  /**
   * Helper: Sanitize date
   */
  private sanitizeDate(value: any): string {
    const date = new Date(value);
    return date.toISOString();
  }

  /**
   * Helper: Sanitize currency
   */
  private sanitizeCurrency(value: any): string {
    if (!value) return 'USD';
    const currency = String(value).toUpperCase().trim();
    // Basic currency code validation (3 letters)
    return /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
  }

  /**
   * Batch validate data
   */
  batchValidate(
    data: any[],
    type: 'metric' | 'review' | 'crash',
  ): { valid: any[]; invalid: any[] } {
    const valid: any[] = [];
    const invalid: any[] = [];

    data.forEach((item, index) => {
      let result;
      switch (type) {
        case 'metric':
          result = this.validateDailyMetric(item);
          break;
        case 'review':
          result = this.validateReview(item);
          break;
        case 'crash':
          result = this.validateCrash(item);
          break;
      }

      if (result.valid) {
        valid.push(result.sanitized);
      } else {
        invalid.push({ index, data: item, errors: result.errors });
        this.logger.warn(`Validation failed for ${type} at index ${index}:`, result.errors);
      }
    });

    return { valid, invalid };
  }
}
