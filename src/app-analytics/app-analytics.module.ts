import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../common/database/database.module';
import { AppAnalyticsController } from './app-analytics.controller';
import { AnalyticsDataService } from './services/analytics-data.service';
import { AnalyticsSyncService } from './services/analytics-sync.service';
import { AppleAuthService } from './services/apple/apple-auth.service';
import { AppleAnalyticsService } from './services/apple/apple-analytics.service';
import { GooglePlayService } from './services/google/google-play.service';
import { FirebaseAnalyticsService } from './services/firebase/firebase-analytics.service';
import { AnalyticsSyncScheduler } from './schedulers/analytics-sync.scheduler';
import { AnalyticsLoggerService } from './services/analytics-logger.service';
import { AnalyticsValidatorService } from './services/analytics-validator.service';
import { AnalyticsCacheService } from './services/analytics-cache.service';

/**
 * App Analytics Module
 * Integrates Apple App Store, Google Play Store, and Firebase Analytics
 */
@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [AppAnalyticsController],
  providers: [
    // Data services
    AnalyticsDataService,
    AnalyticsSyncService,
    
    // Apple services
    AppleAuthService,
    AppleAnalyticsService,
    
    // Google services
    GooglePlayService,
    
    // Firebase services
    FirebaseAnalyticsService,
    
    // Utility services
    AnalyticsLoggerService,
    AnalyticsValidatorService,
    AnalyticsCacheService,
    
    // Schedulers
    AnalyticsSyncScheduler,
  ],
  exports: [
    AnalyticsDataService,
    AnalyticsSyncService,
    AnalyticsLoggerService,
    AnalyticsValidatorService,
    AnalyticsCacheService,
  ],
})
export class AppAnalyticsModule {}
