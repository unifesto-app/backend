import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface AuditLogData {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
  project: 'backend' | 'admin' | 'auth';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<string> {
    try {
      const { data: result, error } = await this.databaseService
        .getClient()
        .rpc('log_audit_event', {
          p_user_id: data.userId || null,
          p_action: data.action,
          p_resource_type: data.resourceType,
          p_resource_id: data.resourceId || null,
          p_details: data.details || {},
          p_ip_address: data.ipAddress || null,
          p_user_agent: data.userAgent || null,
          p_status: data.status,
          p_error_message: data.errorMessage || null,
          p_project: data.project,
        });

      if (error) {
        this.logger.error('Failed to log audit event', error);
        throw error;
      }

      return result;
    } catch (error) {
      this.logger.error('Error logging audit event', error);
      // Don't throw - audit logging should not break the main flow
      return null;
    }
  }

  /**
   * Log successful action
   */
  async logSuccess(
    action: string,
    resourceType: string,
    options?: {
      userId?: string;
      resourceId?: string;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      project?: 'backend' | 'admin' | 'auth';
    },
  ): Promise<string> {
    return this.log({
      action,
      resourceType,
      status: 'success',
      project: options?.project || 'backend',
      ...options,
    });
  }

  /**
   * Log failed action
   */
  async logFailure(
    action: string,
    resourceType: string,
    errorMessage: string,
    options?: {
      userId?: string;
      resourceId?: string;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      project?: 'backend' | 'admin' | 'auth';
    },
  ): Promise<string> {
    return this.log({
      action,
      resourceType,
      status: 'failure',
      errorMessage,
      project: options?.project || 'backend',
      ...options,
    });
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    project?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = this.databaseService
        .getClient()
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters?.project) {
        query = query.eq('project', filters.project);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      query = query
        .order('created_at', { ascending: false })
        .range(
          filters?.offset || 0,
          (filters?.offset || 0) + (filters?.limit || 50) - 1,
        );

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Failed to fetch audit logs', error);
        throw error;
      }

      return {
        logs: data,
        total: count,
      };
    } catch (error) {
      this.logger.error('Error fetching audit logs', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getStats(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    project?: string;
  }) {
    try {
      let query = this.databaseService
        .getClient()
        .from('audit_logs')
        .select('action, status, project');

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.project) {
        query = query.eq('project', filters.project);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Failed to fetch audit stats', error);
        throw error;
      }

      // Calculate statistics
      const stats = {
        total: data.length,
        byStatus: {} as Record<string, number>,
        byAction: {} as Record<string, number>,
        byProject: {} as Record<string, number>,
      };

      data.forEach((log) => {
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        stats.byProject[log.project] = (stats.byProject[log.project] || 0) + 1;
      });

      return stats;
    } catch (error) {
      this.logger.error('Error fetching audit stats', error);
      throw error;
    }
  }
}
