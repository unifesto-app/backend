import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { RejectEventDto } from './dto/reject-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { OrgRole } from '../permissions/interfaces/permission.interface';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Get all events accessible by user
   */
  async findAll(userId: string, query: EventQueryDto) {
    try {
      // Get accessible organizations
      const accessibleOrgs = await this.permissionsService.getUserAccessibleOrgs(
        userId,
      );

      if (accessibleOrgs.length === 0 && !query.created_by) {
        return {
          data: [],
          total: 0,
          page: query.page,
          limit: query.limit,
        };
      }

      const orgIds = accessibleOrgs.map((org) => org.orgId);

      // Build query
      let dbQuery = this.supabaseService
        .getClient()
        .from('events')
        .select('*, organization:organizations(id, name, slug)', {
          count: 'exact',
        });

      // Filter by accessible orgs or created by user
      if (query.created_by) {
        dbQuery = dbQuery.eq('created_by', query.created_by);
      } else {
        dbQuery = dbQuery.in('organization_id', orgIds);
      }

      // Apply filters
      if (query.organization_id) {
        dbQuery = dbQuery.eq('organization_id', query.organization_id);
      }

      if (query.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      dbQuery = dbQuery.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await dbQuery;

      if (error) {
        this.logger.error(`Error fetching events: ${error.message}`);
        throw new BadRequestException('Failed to fetch events');
      }

      return {
        data: data || [],
        total: count || 0,
        page: query.page,
        limit: query.limit,
      };
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async findOne(userId: string, eventId: string) {
    try {
      const { data: event, error } = await this.supabaseService
        .getClient()
        .from('events')
        .select(`
          *,
          organization:organizations(id, name, slug, type),
          creator:profiles!created_by(id, name, email, avatar_url)
        `)
        .eq('id', eventId)
        .single();

      if (error || !event) {
        throw new NotFoundException('Event not found');
      }

      // Check access
      const canAccess = await this.canAccessEvent(userId, event);

      if (!canAccess) {
        throw new ForbiddenException('Access denied to this event');
      }

      return event;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new event
   */
  async create(userId: string, createDto: CreateEventDto) {
    try {
      // Check if user can create events in this organization
      const permissions = await this.permissionsService.getOrgPermissions(
        userId,
        createDto.organization_id,
      );

      if (!permissions.canCreateEvents) {
        throw new ForbiddenException(
          'Cannot create events in this organization',
        );
      }

      // Validate dates
      if (new Date(createDto.start_date) >= new Date(createDto.end_date)) {
        throw new BadRequestException('End date must be after start date');
      }

      // Determine initial status based on role
      let initialStatus = 'draft';
      if (permissions.role === OrgRole.ORGANIZER) {
        // Organizers create events as pending (requires approval)
        initialStatus = 'pending';
      } else if (
        permissions.role === OrgRole.ADMIN ||
        permissions.role === OrgRole.OWNER
      ) {
        // Admins can create as draft or published
        initialStatus = 'draft';
      }

      // Create event
      const { data: newEvent, error } = await this.supabaseService
        .getClient()
        .from('events')
        .insert({
          ...createDto,
          created_by: userId,
          status: initialStatus,
          submitted_for_approval_at:
            initialStatus === 'pending' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating event: ${error.message}`);
        throw new BadRequestException('Failed to create event');
      }

      // Log approval history if pending
      if (initialStatus === 'pending') {
        await this.logApprovalHistory(newEvent.id, 'submitted', userId);
      }

      this.logger.log(`Event created: ${newEvent.id} by user ${userId}`);
      return newEvent;
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update event
   */
  async update(userId: string, eventId: string, updateDto: UpdateEventDto) {
    try {
      // Get event
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check permissions
      const canUpdate = await this.canUpdateEvent(userId, event);

      if (!canUpdate) {
        throw new ForbiddenException('Cannot update this event');
      }

      // Validate dates if provided
      const startDate = (updateDto as any).start_date || event.start_date;
      const endDate = (updateDto as any).end_date || event.end_date;

      if (new Date(startDate) >= new Date(endDate)) {
        throw new BadRequestException('End date must be after start date');
      }

      // Update event
      const { data: updated, error } = await this.supabaseService
        .getClient()
        .from('events')
        .update(updateDto)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating event: ${error.message}`);
        throw new BadRequestException('Failed to update event');
      }

      this.logger.log(`Event updated: ${eventId} by user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete event
   */
  async remove(userId: string, eventId: string) {
    try {
      // Get event
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check permissions
      const canDelete = await this.canDeleteEvent(userId, event);

      if (!canDelete) {
        throw new ForbiddenException('Cannot delete this event');
      }

      // Delete event
      const { error } = await this.supabaseService
        .getClient()
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        this.logger.error(`Error deleting event: ${error.message}`);
        throw new BadRequestException('Failed to delete event');
      }

      this.logger.log(`Event deleted: ${eventId} by user ${userId}`);
      return { message: 'Event deleted successfully' };
    } catch (error) {
      this.logger.error(`Error in remove: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit event for approval
   */
  async submitForApproval(userId: string, eventId: string) {
    try {
      // Get event
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check if user is the creator
      if (event.created_by !== userId) {
        throw new ForbiddenException('Only event creator can submit for approval');
      }

      // Check current status
      if (event.status !== 'draft' && event.status !== 'rejected') {
        throw new BadRequestException(
          `Cannot submit event with status: ${event.status}`,
        );
      }

      // Update status to pending
      const { data: updated, error } = await this.supabaseService
        .getClient()
        .from('events')
        .update({
          status: 'pending',
          submitted_for_approval_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error submitting event: ${error.message}`);
        throw new BadRequestException('Failed to submit event');
      }

      // Log approval history
      await this.logApprovalHistory(eventId, 'submitted', userId);

      this.logger.log(`Event submitted for approval: ${eventId} by user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error in submitForApproval: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve event
   */
  async approve(userId: string, eventId: string, approveDto: ApproveEventDto) {
    try {
      // Get event
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check if user can approve events
      const canApprove = await this.permissionsService.canApproveEvents(
        userId,
        event.organization_id,
      );

      if (!canApprove) {
        throw new ForbiddenException('Cannot approve events in this organization');
      }

      // Check current status
      if (event.status !== 'pending') {
        throw new BadRequestException(
          `Cannot approve event with status: ${event.status}`,
        );
      }

      // Update status to approved/published
      const { data: updated, error } = await this.supabaseService
        .getClient()
        .from('events')
        .update({
          status: 'published',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error approving event: ${error.message}`);
        throw new BadRequestException('Failed to approve event');
      }

      // Log approval history
      await this.logApprovalHistory(
        eventId,
        'approved',
        userId,
        approveDto.notes,
      );

      this.logger.log(`Event approved: ${eventId} by user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error in approve: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject event
   */
  async reject(userId: string, eventId: string, rejectDto: RejectEventDto) {
    try {
      // Get event
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check if user can approve events (same permission for reject)
      const canApprove = await this.permissionsService.canApproveEvents(
        userId,
        event.organization_id,
      );

      if (!canApprove) {
        throw new ForbiddenException('Cannot reject events in this organization');
      }

      // Check current status
      if (event.status !== 'pending') {
        throw new BadRequestException(
          `Cannot reject event with status: ${event.status}`,
        );
      }

      // Update status to rejected
      const { data: updated, error } = await this.supabaseService
        .getClient()
        .from('events')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectDto.reason,
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error rejecting event: ${error.message}`);
        throw new BadRequestException('Failed to reject event');
      }

      // Log approval history
      await this.logApprovalHistory(eventId, 'rejected', userId, rejectDto.reason);

      this.logger.log(`Event rejected: ${eventId} by user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error in reject: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending events for admin
   */
  async getPendingEvents(userId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('get_pending_events_for_admin', {
          p_user_id: userId,
        });

      if (error) {
        this.logger.error(`Error getting pending events: ${error.message}`);
        throw new BadRequestException('Failed to get pending events');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error in getPendingEvents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event approval history
   */
  async getApprovalHistory(userId: string, eventId: string) {
    try {
      // Check if user can access event
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const canAccess = await this.canAccessEvent(userId, event);

      if (!canAccess) {
        throw new ForbiddenException('Access denied to this event');
      }

      // Get approval history
      const { data: history, error } = await this.supabaseService
        .getClient()
        .from('event_approval_history')
        .select(`
          *,
          performer:profiles!performed_by(id, name, email, avatar_url)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error getting approval history: ${error.message}`);
        throw new BadRequestException('Failed to get approval history');
      }

      return history || [];
    } catch (error) {
      this.logger.error(`Error in getApprovalHistory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user can access event
   */
  private async canAccessEvent(userId: string, event: any): Promise<boolean> {
    // Creator can always access
    if (event.created_by === userId) {
      return true;
    }

    // Check org access
    return await this.permissionsService.hasHierarchyAccess(
      userId,
      event.organization_id,
      OrgRole.MEMBER,
    );
  }

  /**
   * Check if user can update event
   */
  private async canUpdateEvent(userId: string, event: any): Promise<boolean> {
    // Creator can update own events
    if (event.created_by === userId) {
      return true;
    }

    // Admins can update any event in their org
    const permissions = await this.permissionsService.getOrgPermissions(
      userId,
      event.organization_id,
    );

    return permissions.canManageEvents;
  }

  /**
   * Check if user can delete event
   */
  private async canDeleteEvent(userId: string, event: any): Promise<boolean> {
    // Creator can delete own events
    if (event.created_by === userId) {
      return true;
    }

    // Admins can delete any event in their org
    const permissions = await this.permissionsService.getOrgPermissions(
      userId,
      event.organization_id,
    );

    return permissions.canManageEvents;
  }

  /**
   * Log approval history
   */
  private async logApprovalHistory(
    eventId: string,
    action: string,
    performedBy: string,
    reason?: string,
  ) {
    try {
      await this.supabaseService
        .getClient()
        .from('event_approval_history')
        .insert({
          event_id: eventId,
          action,
          performed_by: performedBy,
          reason: reason || null,
        });
    } catch (error) {
      this.logger.error(`Error logging approval history: ${error.message}`);
      // Don't throw - this is non-critical
    }
  }
}
