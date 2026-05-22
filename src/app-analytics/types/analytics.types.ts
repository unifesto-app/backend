/**
 * Type definitions for App Analytics System
 * Covers Apple App Store, Google Play Store, and Firebase Analytics
 */

// =====================================================
// COMMON TYPES
// =====================================================

export type Platform = 'ios' | 'android' | 'web';
export type AnalyticsSource = 'apple' | 'google' | 'firebase';
export type SyncStatus = 'running' | 'success' | 'failed' | 'partial';
export type CrashType = 'crash' | 'anr' | 'exception';
export type CrashStatus = 'open' | 'investigating' | 'resolved' | 'ignored';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// =====================================================
// DATABASE MODELS
// =====================================================

export interface DailyMetric {
  id: string;
  platform: Platform;
  source: AnalyticsSource;
  metricDate: Date;

  // Downloads & Installs
  downloads: number;
  installs: number;
  uninstalls: number;

  // Users
  activeUsers: number;
  newUsers: number;
  dau: number;
  mau: number;

  // Engagement
  sessions: number;
  avgSessionDurationSeconds: number;
  screenViews: number;

  // Retention
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;

  // Revenue
  revenueCents: number;
  proceedsCents: number;
  currency: string;

  // Subscriptions
  newSubscriptions: number;
  activeSubscriptions: number;
  churnedSubscriptions: number;
  subscriptionRevenueCents: number;

  // Quality
  crashes: number;
  crashFreeUsersPercentage: number;
  anrCount: number;

  // Metadata
  rawData?: Record<string, any>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  platform: Platform;
  source: AnalyticsSource;
  reviewId: string;

  // Content
  rating: number;
  title?: string;
  reviewText?: string;

  // User
  reviewerName?: string;
  reviewerId?: string;

  // Version
  appVersion?: string;

  // Developer response
  developerResponse?: string;
  developerResponseDate?: Date;

  // Dates
  reviewDate: Date;
  modifiedDate?: Date;

  // Metadata
  rawData?: Record<string, any>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Crash {
  id: string;
  platform: Platform;
  source: AnalyticsSource;
  crashId?: string;
  crashType: CrashType;

  // Details
  errorMessage?: string;
  stackTrace?: string;
  exceptionType?: string;

  // Context
  appVersion: string;
  osVersion?: string;
  deviceModel?: string;

  // Metrics
  occurrenceCount: number;
  affectedUsers: number;

  // Dates
  firstOccurredAt: Date;
  lastOccurredAt: Date;
  crashDate: Date;

  // Status
  status: CrashStatus;

  // Metadata
  rawData?: Record<string, any>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomEvent {
  id: string;
  platform: Platform;
  eventName: string;
  eventCategory?: string;

  // Metrics
  eventCount: number;
  uniqueUsers: number;

  // Parameters
  eventParams?: Record<string, any>;

  // Date
  eventDate: Date;

  // Metadata
  rawData?: Record<string, any>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncJobStatus {
  id: string;
  source: AnalyticsSource;
  syncType: string;
  status: SyncStatus;

  // Metrics
  recordsSynced: number;
  recordsFailed: number;

  // Date range
  syncStartDate?: Date;
  syncEndDate?: Date;

  // Error
  errorMessage?: string;
  errorDetails?: Record<string, any>;

  // Timing
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;

  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
}

// =====================================================
// APPLE APP STORE TYPES
// =====================================================

export interface AppleAuthConfig {
  keyId: string;
  issuerId: string;
  privateKey: string;
  bundleId: string;
}

export interface AppleJWT {
  token: string;
  expiresAt: Date;
}

export interface AppleSalesReport {
  date: Date;
  downloads: number;
  updates: number;
  proceeds: number;
  currency: string;
  country: string;
  productType: string;
}

export interface AppleSubscriptionReport {
  date: Date;
  activeSubscriptions: number;
  newSubscriptions: number;
  renewals: number;
  cancellations: number;
  revenue: number;
  currency: string;
}

export interface AppleReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  reviewerNickname: string;
  territory: string;
  createdDate: string;
  modifiedDate?: string;
}

export interface AppleCrashReport {
  crashId: string;
  appVersion: string;
  osVersion: string;
  deviceType: string;
  crashCount: number;
  affectedUsers: number;
  errorType: string;
  errorMessage: string;
  stackTrace: string;
  firstOccurrence: string;
  lastOccurrence: string;
}

// =====================================================
// GOOGLE PLAY STORE TYPES
// =====================================================

export interface GoogleAuthConfig {
  clientEmail: string;
  privateKey: string;
  packageName: string;
}

export interface GoogleInstallsReport {
  date: Date;
  installs: number;
  uninstalls: number;
  activeDeviceInstalls: number;
  country: string;
}

export interface GoogleSubscriptionReport {
  date: Date;
  activeSubscriptions: number;
  newSubscriptions: number;
  cancellations: number;
  revenue: number;
  currency: string;
}

export interface GoogleReview {
  reviewId: string;
  authorName: string;
  comments: Array<{
    userComment: {
      text: string;
      starRating: number;
      reviewerLanguage: string;
      lastModified: {
        seconds: string;
      };
      appVersionCode?: number;
      appVersionName?: string;
    };
    developerComment?: {
      text: string;
      lastModified: {
        seconds: string;
      };
    };
  }>;
}

export interface GoogleCrashReport {
  crashId: string;
  appVersionCode: number;
  appVersionName: string;
  osVersion: string;
  deviceModel: string;
  crashCount: number;
  affectedUsers: number;
  exceptionType: string;
  exceptionMessage: string;
  stackTrace: string;
  firstOccurrence: string;
  lastOccurrence: string;
}

export interface GoogleANRReport {
  anrId: string;
  appVersionCode: number;
  appVersionName: string;
  osVersion: string;
  deviceModel: string;
  anrCount: number;
  affectedUsers: number;
  anrType: string;
  stackTrace: string;
  firstOccurrence: string;
  lastOccurrence: string;
}

// =====================================================
// FIREBASE ANALYTICS TYPES
// =====================================================

export interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface FirebaseAnalyticsReport {
  date: Date;
  platform: Platform;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  avgSessionDuration: number;
  screenViews: number;
  eventCount: number;
}

export interface FirebaseRetentionReport {
  cohortDate: Date;
  platform: Platform;
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
}

export interface FirebaseEvent {
  eventName: string;
  eventDate: Date;
  platform: Platform;
  eventCount: number;
  uniqueUsers: number;
  eventParams: Record<string, any>;
}

export interface FirebaseUserProperty {
  propertyName: string;
  propertyValue: string;
  userCount: number;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface AnalyticsOverviewRequest {
  startDate?: string;
  endDate?: string;
  platform?: Platform;
}

export interface AnalyticsOverviewResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalDownloads: number;
    totalInstalls: number;
    totalActiveUsers: number;
    totalRevenue: number;
    totalSessions: number;
    avgCrashFreePercentage: number;
  };
  byPlatform: {
    ios: PlatformMetrics;
    android: PlatformMetrics;
  };
}

export interface PlatformMetrics {
  downloads: number;
  installs: number;
  activeUsers: number;
  revenue: number;
  sessions: number;
  crashFreePercentage: number;
}

export interface RevenueAnalyticsResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalProceeds: number;
  currency: string;
  byPlatform: {
    ios: RevenueBreakdown;
    android: RevenueBreakdown;
  };
  chartData: Array<{
    date: string;
    ios: number;
    android: number;
    total: number;
  }>;
}

export interface RevenueBreakdown {
  revenue: number;
  proceeds: number;
  subscriptionRevenue: number;
  newSubscriptions: number;
  activeSubscriptions: number;
}

export interface UserAnalyticsResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalActiveUsers: number;
    totalNewUsers: number;
    avgDau: number;
    avgMau: number;
    dauMauRatio: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  chartData: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
    dau: number;
  }>;
}

export interface ReviewsResponse {
  reviews: Review[];
  summary: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface CrashAnalyticsResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalCrashes: number;
    totalAnrs: number;
    crashFreeUsersPercentage: number;
    affectedUsers: number;
  };
  topCrashes: Crash[];
  byVersion: Array<{
    version: string;
    crashes: number;
    anrs: number;
    affectedUsers: number;
  }>;
}

// =====================================================
// SYNC JOB TYPES
// =====================================================

export interface SyncJobConfig {
  source: AnalyticsSource;
  syncType: string;
  dateRange: DateRange;
  options?: Record<string, any>;
}

export interface SyncJobResult {
  success: boolean;
  recordsSynced: number;
  recordsFailed: number;
  errors: Array<{
    record: any;
    error: string;
  }>;
  duration: number;
}

// =====================================================
// ERROR TYPES
// =====================================================

export class AnalyticsError extends Error {
  constructor(
    message: string,
    public source: AnalyticsSource,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export class AppleAPIError extends AnalyticsError {
  constructor(message: string, code?: string, details?: any) {
    super(message, 'apple', code, details);
    this.name = 'AppleAPIError';
  }
}

export class GoogleAPIError extends AnalyticsError {
  constructor(message: string, code?: string, details?: any) {
    super(message, 'google', code, details);
    this.name = 'GoogleAPIError';
  }
}

export class FirebaseAPIError extends AnalyticsError {
  constructor(message: string, code?: string, details?: any) {
    super(message, 'firebase', code, details);
    this.name = 'FirebaseAPIError';
  }
}
