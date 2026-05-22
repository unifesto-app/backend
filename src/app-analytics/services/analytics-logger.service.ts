import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/database/supabase.service';

/**
 * Analytics Logger Service
 * Centralized logging for analytics operations
 */
@Injectable()
export class AnalyticsLoggerService {
  private readonly logger = new Logger(AnalyticsLoggerService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Log sync start
   */
  async logSyncStart(source: string, syncType: string, metadata?: any): Promise<string> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('analytics_sync_status')
        .insert({
          source,
          sync_type: syncType,
          status: 'running',
          started_at: new Date().toISOString(),
          metadata,
        })
        .select('id')
        .single();

      if (error) throw error;

      this.logger.log(`[${source}] Sync started: ${syncType} (ID: ${data.id})`);
      return data.id;
    } catch (error) {
      this.logger.error(`Failed to log sync start: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log sync completion
   */
  async logSyncComplete(
    syncId: string,
    status: 'success' | 'failed' | 'partial',
    recordsSynced: number,
    recordsFailed: number,
    durationSeconds: number,
    errorMessage?: string,
    errorDetails?: any,
  ): Promise<void> {
    try {
      await this.supabaseService.getClient()
        .from('analytics_sync_status')
        .update({
          status,
          records_synced: recordsSynced,
          records_failed: recordsFailed,
          duration_seconds: durationSeconds,
          error_message: errorMessage,
          error_details: errorDetails,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncId);

      const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⚠️';
      this.logger.log(
        `${emoji} Sync completed: ${recordsSynced} synced, ${recordsFailed} failed (${durationSeconds}s)`,
      );
    } catch (error) {
      this.logger.error(`Failed to log sync completion: ${error.message}`);
    }
  }

  /**
   * Log API error
   */
  logApiError(source: string, operation: string, error: any): void {
    this.logger.error(`[${source}] API Error in ${operation}:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      details: error.response?.data,
    });
  }

  /**
   * Log rate limit
   */
  logRateLimit(source: string, retryAfter?: number): void {
    this.logger.warn(
      `[${source}] Rate limit hit${retryAfter ? `, retry after ${retryAfter}s` : ''}`,
    );
  }

  /**
   * Log retry attempt
   */
  logRetry(source: string, operation: string, attempt: number, maxAttempts: number): void {
    this.logger.warn(`[${source}] Retrying ${operation} (${attempt}/${maxAttempts})`);
  }

  /**
   * Log data quality issue
   */
  logDataQualityIssue(source: string, issue: string, data?: any): void {
    this.logger.warn(`[${source}] Data quality issue: ${issue}`, data);
  }

  /**
   * Get recent sync history
   */
  async getSyncHistory(source?: string, limit: number = 10): Promise<any[]> {
    try {
      let query = this.supabaseService
        .getClient()
        .from('analytics_sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error(`Failed to get sync history: ${error.message}`);
      return [];
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(source?: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = this.supabaseService
        .getClient()
        .from('analytics_sync_status')
        .select('*')
        .gte('started_at', startDate.toISOString());

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        successful: data?.filter((s) => s.status === 'success').length || 0,
        failed: data?.filter((s) => s.status === 'failed').length || 0,
        partial: data?.filter((s) => s.status === 'partial').length || 0,
        totalRecordsSynced: data?.reduce((sum, s) => sum + (s.records_synced || 0), 0) || 0,
        totalRecordsFailed: data?.reduce((sum, s) => sum + (s.records_failed || 0), 0) || 0,
        avgDuration: data?.length
          ? data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / data.length
          : 0,
      };

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get sync statistics: ${error.message}`);
      return null;
    }
  }
}
