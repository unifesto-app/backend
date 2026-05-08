import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Get overall analytics for organization
   */
  async getOrganizationOverall(
    userId: string,
    orgId: string,
    query: AnalyticsQueryDto,
  ) {
    try {
      // Check permissions
      const permissions = await this.permissionsService.getOrgPermissions(
        userId,
        orgId,
      );

      if (!permissions.canViewAnalytics) {
        throw new ForbiddenException('Cannot view analytics for this organization');
      }

      // Get organization
      const { data: org } = await this.supabaseService
        .getClient()
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (!org) {
        throw new NotFoundException('Organization not found');
      }

      // Build date filter
      const startDate = query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = query.end_date || new Date().toISOString();

      // Get org IDs based on analytics scope
      let orgIds = [orgId];
      if (permissions.analyticsScope === 'hierarchy') {
        // Get all child orgs
        const { data: hierarchy } = await this.supabaseService
          .getClient()
          .rpc('get_organization_hierarchy', { org_id: orgId });

        if (hierarchy) {
          orgIds = hierarchy.map((o: any) => o.id);
        }
      }

      // Get metrics
      const [memberCount, eventCount, activeEvents] = await Promise.all([
        this.getMemberCount(orgIds),
        this.getEventCount(orgIds, startDate, endDate),
        this.getActiveEventCount(orgIds),
      ]);

      return {
        organization: {
          id: org.id,
          name: org.name,
          type: org.type,
        },
        period: {
          start_date: startDate,
          end_date: endDate,
        },
        scope: permissions.analyticsScope,
        metrics: {
          total_members: memberCount,
          total_events: eventCount,
          active_events: activeEvents,
          sub_organizations: permissions.analyticsScope === 'hierarchy' ? orgIds.length - 1 : 0,
        },
      };
    } catch (error) {
      this.logger.error(`Error in getOrganizationOverall: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get individual analytics breakdown
   */
  async getOrganizationIndividual(
    userId: string,
    orgId: string,
    query: AnalyticsQueryDto,
  ) {
    try {
      // Check permissions
      const permissions = await this.permissionsService.getOrgPermissions(
        userId,
        orgId,
      );

      if (!permissions.canViewAnalytics) {
        throw new ForbiddenException('Cannot view analytics for this organization');
      }

      // Build date filter
      const startDate = query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = query.end_date || new Date().toISOString();

      // Get sub-organizations
      const { data: subOrgs } = await this.supabaseService
        .getClient()
        .from('organizations')
        .select('id, name, type, slug')
        .eq('parent_org_id', orgId)
        .eq('is_active', true);

      // Get metrics for each sub-org
      const subOrgMetrics = await Promise.all(
        (subOrgs || []).map(async (subOrg) => {
          const [memberCount, eventCount] = await Promise.all([
            this.getMemberCount([subOrg.id]),
            this.getEventCount([subOrg.id], startDate, endDate),
          ]);

          return {
            organization: subOrg,
            metrics: {
              members: memberCount,
              events: eventCount,
            },
          };
        }),
      );

      // Get events for this org
      const { data: events } = await this.supabaseService
        .getClient()
        .from('events')
        .select('id, title, status, start_date, end_date, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      return {
        period: {
          start_date: startDate,
          end_date: endDate,
        },
        sub_organizations: subOrgMetrics,
        events: events || [],
      };
    } catch (error) {
      this.logger.error(`Error in getOrganizationIndividual: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(
    userId: string,
    eventId: string,
    query: AnalyticsQueryDto,
  ) {
    try {
      // Get event
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*, organization:organizations(id, name)')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check permissions
      const permissions = await this.permissionsService.getOrgPermissions(
        userId,
        event.organization_id,
      );

      // Check if user can view this event's analytics
      const canView =
        permissions.canViewAnalytics &&
        (permissions.analyticsScope === 'events' ||
          permissions.analyticsScope === 'organization' ||
          permissions.analyticsScope === 'hierarchy' ||
          event.created_by === userId);

      if (!canView) {
        throw new ForbiddenException('Cannot view analytics for this event');
      }

      // For now, return basic event info
      // In a real implementation, you'd query registrations, attendance, etc.
      return {
        event: {
          id: event.id,
          title: event.title,
          status: event.status,
          start_date: event.start_date,
          end_date: event.end_date,
          organization: event.organization,
        },
        metrics: {
          // Placeholder metrics - implement based on your event registration system
          total_registrations: 0,
          total_attendance: 0,
          views: 0,
        },
      };
    } catch (error) {
      this.logger.error(`Error in getEventAnalytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export analytics report
   */
  async exportReport(userId: string, orgId: string, query: AnalyticsQueryDto) {
    try {
      // Check permissions
      const permissions = await this.permissionsService.getOrgPermissions(
        userId,
        orgId,
      );

      if (!permissions.canExportReports) {
        throw new ForbiddenException('Cannot export reports for this organization');
      }

      // Get overall and individual analytics
      const [overall, individual] = await Promise.all([
        this.getOrganizationOverall(userId, orgId, query),
        this.getOrganizationIndividual(userId, orgId, query),
      ]);

      // In a real implementation, you'd generate a CSV/PDF and return a download URL
      // For now, return the data
      return {
        format: 'json',
        data: {
          overall,
          individual,
        },
        generated_at: new Date().toISOString(),
        generated_by: userId,
      };
    } catch (error) {
      this.logger.error(`Error in exportReport: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper: Get member count for organizations
   */
  private async getMemberCount(orgIds: string[]): Promise<number> {
    const { count } = await this.supabaseService
      .getClient()
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .in('organization_id', orgIds);

    return count || 0;
  }

  /**
   * Helper: Get event count for organizations
   */
  private async getEventCount(
    orgIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const { count } = await this.supabaseService
      .getClient()
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('organization_id', orgIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    return count || 0;
  }

  /**
   * Helper: Get active event count
   */
  private async getActiveEventCount(orgIds: string[]): Promise<number> {
    const { count } = await this.supabaseService
      .getClient()
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('organization_id', orgIds)
      .in('status', ['published', 'approved'])
      .gte('end_date', new Date().toISOString());

    return count || 0;
  }
}
