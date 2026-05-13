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
import { RelationshipType } from '../permissions/interfaces/permission.interface';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Get all events accessible by user
   * NEW: Shows events created by user OR events they're a collaborator on
   */
  async findAll(userId: string, query: EventQueryDto) {
    try {
      // Get events created by user
      let dbQuery = this.supabaseService
        .getClient()
        .from('events')
        .select('*, organization:organizations(id, name, slug)', {
          count: 'exact',
        });

      // Get events where user is creator OR collaborator
      const { data: collaboratorEvents } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .select('event_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      const collaboratorEventIds = collaboratorEvents?.map(c => c.event_id) || [];

      // Filter: created by user OR user is collaborator
      if (query.created_by) {
        dbQuery = dbQuery.eq('created_by', query.created_by);
      } else {
        // Show events created by user or where they're a collaborator
        if (collaboratorEventIds.length > 0) {
          dbQuery = dbQuery.or(`created_by.eq.${userId},id.in.(${collaboratorEventIds.join(',')})`);
        } else {
          dbQuery = dbQuery.eq('created_by', userId);
        }
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

      // Fetch creator details for each event
      const eventsWithCreators = await Promise.all(
        (data || []).map(async (event) => {
          const { data: creator } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('id, name, email, avatar_url')
            .eq('id', event.created_by)
            .single();

          return {
            ...event,
            creator: creator || null,
          };
        })
      );

      return {
        data: eventsWithCreators,
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
      // First, get the event
      const { data: event, error } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        this.logger.error(`Error fetching event: ${error.message}`);
        throw new NotFoundException('Event not found');
      }

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check access
      const canAccess = await this.canAccessEvent(userId, event);

      if (!canAccess) {
        throw new ForbiddenException('Access denied to this event');
      }

      // Fetch organization details
      const { data: organization } = await this.supabaseService
        .getClient()
        .from('organizations')
        .select('id, name, slug, type')
        .eq('id', event.organization_id)
        .single();

      // Fetch creator details
      const { data: creator } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id, name, email, avatar_url')
        .eq('id', event.created_by)
        .single();

      // Combine the data
      return {
        ...event,
        organization: organization || null,
        creator: creator || null,
      };
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

      // Check if slug is unique (if provided)
      if (createDto.slug) {
        const { data: existing } = await this.supabaseService
          .getClient()
          .from('events')
          .select('id')
          .eq('slug', createDto.slug)
          .single();

        if (existing) {
          throw new BadRequestException('Event slug already exists');
        }
      }

      // Validate dates
      if (new Date(createDto.start_date) >= new Date(createDto.end_date)) {
        throw new BadRequestException('End date must be after start date');
      }

      // Check user's platform role
      const { data: profile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const platformRole = profile?.role;

      // Determine initial status based on user's role
      let initialStatus = 'draft';
      
      // Platform super admin, org_super_admin, and Org Owner can publish directly
      if (
        platformRole === 'super_admin' ||
        platformRole === 'org_super_admin' ||
        permissions.role === RelationshipType.OWNER
      ) {
        initialStatus = 'published';
      }

      // Create event
      const { data: newEvent, error } = await this.supabaseService
        .getClient()
        .from('events')
        .insert({
          ...createDto,
          created_by: userId,
          status: initialStatus,
          submitted_for_approval_at: null,
          // If auto-published, set approval fields
          ...(initialStatus === 'published' && {
            approved_by: userId,
            approved_at: new Date().toISOString(),
          }),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating event: ${error.message}`);
        throw new BadRequestException('Failed to create event');
      }

      this.logger.log(
        `Event created: ${newEvent.id} by user ${userId} (platform role: ${platformRole}, org role: ${permissions.role}) with status ${initialStatus}`,
      );
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

      // If updating slug, check uniqueness
      if ((updateDto as any).slug) {
        const { data: existing } = await this.supabaseService
          .getClient()
          .from('events')
          .select('id')
          .eq('slug', (updateDto as any).slug)
          .neq('id', eventId)
          .single();

        if (existing) {
          throw new BadRequestException('Event slug already exists');
        }
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
      // Get event with creator details
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check current status
      if (event.status !== 'pending') {
        throw new BadRequestException(
          `Cannot approve event with status: ${event.status}`,
        );
      }

      // Get creator's platform role
      const { data: creatorProfile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('role')
        .eq('id', event.created_by)
        .single();

      // Get creator's org relationship
      const { data: creatorMembership } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('relationship_type')
        .eq('user_id', event.created_by)
        .eq('organization_id', event.organization_id)
        .single();

      // Get approver's platform role
      const { data: approverProfile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // Get approver's permissions
      const approverPermissions = await this.permissionsService.getOrgPermissions(
        userId,
        event.organization_id,
      );

      // Check if user can approve this event based on hierarchy
      const canApprove = await this.canApproveEventHierarchy(
        userId,
        event,
        creatorProfile?.role,
        creatorMembership?.relationship_type,
        approverProfile?.role,
        approverPermissions,
      );

      if (!canApprove) {
        throw new ForbiddenException(
          'You do not have sufficient permissions to approve this event',
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
      // Get event with creator details
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check current status
      if (event.status !== 'pending') {
        throw new BadRequestException(
          `Cannot reject event with status: ${event.status}`,
        );
      }

      // Get creator's platform role
      const { data: creatorProfile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('role')
        .eq('id', event.created_by)
        .single();

      // Get creator's org relationship
      const { data: creatorMembership } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('relationship_type')
        .eq('user_id', event.created_by)
        .eq('organization_id', event.organization_id)
        .single();

      // Get approver's platform role
      const { data: approverProfile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // Get approver's permissions
      const approverPermissions = await this.permissionsService.getOrgPermissions(
        userId,
        event.organization_id,
      );

      // Check if user can reject this event based on hierarchy (same rules as approval)
      const canReject = await this.canApproveEventHierarchy(
        userId,
        event,
        creatorProfile?.role,
        creatorMembership?.relationship_type,
        approverProfile?.role,
        approverPermissions,
      );

      if (!canReject) {
        throw new ForbiddenException(
          'You do not have sufficient permissions to reject this event',
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
  async getPendingEvents(userId: string, organizationId?: string) {
    try {
      // Get accessible organizations where user can approve events
      const accessibleOrgs = await this.permissionsService.getUserAccessibleOrgs(
        userId,
      );

      if (accessibleOrgs.length === 0) {
        return [];
      }

      const orgIds = accessibleOrgs.map((org) => org.orgId);

      // Build query for pending events
      let dbQuery = this.supabaseService
        .getClient()
        .from('events')
        .select('*, organization:organizations(id, name, slug, type)')
        .eq('status', 'pending');

      // Filter by accessible orgs
      dbQuery = dbQuery.in('organization_id', orgIds);

      // Filter by specific organization if provided
      if (organizationId) {
        dbQuery = dbQuery.eq('organization_id', organizationId);
      }

      dbQuery = dbQuery.order('submitted_for_approval_at', { ascending: false });

      const { data, error } = await dbQuery;

      if (error) {
        this.logger.error(`Error getting pending events: ${error.message}`);
        throw new BadRequestException('Failed to get pending events');
      }

      // Fetch creator details for each event
      const eventsWithCreators = await Promise.all(
        (data || []).map(async (event) => {
          const { data: creator } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('id, name, email, avatar_url')
            .eq('id', event.created_by)
            .single();

          return {
            ...event,
            creator: creator || null,
          };
        })
      );

      return eventsWithCreators;
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
   * Check if user can approve event based on hierarchy
   * Platform roles: super_admin, org_super_admin, org_admin, organizer, attendee
   * Org relationships: owner, admin, member
   * 
   * NOTE: Admins can APPROVE events but cannot MANAGE them without explicit permission.
   * To manage an event, admins must request access from the creator.
   * 
   * Rules:
   * - Cannot approve own events
   * - super_admin can approve anything
   * - org_super_admin can approve events by org_admin, organizer, attendee
   * - org_admin can approve events by organizer, attendee
   * - Org owner can approve events by admin, member
   * - Org admin can approve events by member only
   */
  private async canApproveEventHierarchy(
    approverId: string,
    event: any,
    creatorPlatformRole: string,
    creatorOrgRelationship: string,
    approverPlatformRole: string,
    approverPermissions: any,
  ): Promise<boolean> {
    this.logger.log(`Checking approval hierarchy:`);
    this.logger.log(`  Approver ID: ${approverId}`);
    this.logger.log(`  Creator ID: ${event.created_by}`);
    this.logger.log(`  Creator Platform Role: ${creatorPlatformRole}`);
    this.logger.log(`  Creator Org Relationship: ${creatorOrgRelationship}`);
    this.logger.log(`  Approver Platform Role: ${approverPlatformRole}`);
    this.logger.log(`  Approver Org Role: ${approverPermissions.role}`);
    this.logger.log(`  Approver Access Type: ${approverPermissions.accessType}`);

    // Cannot approve own events
    if (event.created_by === approverId) {
      this.logger.log(`  Result: DENIED - Cannot approve own event`);
      return false;
    }

    // Platform super_admin can approve anything
    if (approverPlatformRole === 'super_admin') {
      this.logger.log(`  Result: APPROVED - Platform super_admin`);
      return true;
    }

    // org_super_admin can approve events by org_admin, organizer, attendee
    if (approverPlatformRole === 'org_super_admin') {
      const canApprove = ['org_admin', 'organizer', 'attendee'].includes(creatorPlatformRole);
      this.logger.log(`  Result: ${canApprove ? 'APPROVED' : 'DENIED'} - org_super_admin checking ${creatorPlatformRole}`);
      return canApprove;
    }

    // org_admin can approve events by organizer, attendee
    if (approverPlatformRole === 'org_admin') {
      const canApprove = ['organizer', 'attendee'].includes(creatorPlatformRole);
      this.logger.log(`  Result: ${canApprove ? 'APPROVED' : 'DENIED'} - org_admin checking ${creatorPlatformRole}`);
      return canApprove;
    }

    // Fallback to org relationship-based approval
    const approverOrgRole = approverPermissions.role;

    // Owner (Org Super Admin) can approve events by Admin or Member
    if (approverOrgRole === RelationshipType.OWNER) {
      const canApprove = (
        creatorOrgRelationship === RelationshipType.ADMIN ||
        creatorOrgRelationship === RelationshipType.MEMBER ||
        !creatorOrgRelationship
      );
      this.logger.log(`  Result: ${canApprove ? 'APPROVED' : 'DENIED'} - Org Owner checking ${creatorOrgRelationship}`);
      return canApprove;
    }

    // Admin can approve events by Member only
    if (approverOrgRole === RelationshipType.ADMIN) {
      const canApprove = (
        creatorOrgRelationship === RelationshipType.MEMBER ||
        !creatorOrgRelationship
      );
      this.logger.log(`  Result: ${canApprove ? 'APPROVED' : 'DENIED'} - Org Admin checking ${creatorOrgRelationship}`);
      return canApprove;
    }

    // Members cannot approve events
    this.logger.log(`  Result: DENIED - No approval permissions`);
    return false;
  }

  /**
   * Check if user can access event
   * NEW: Only creator or collaborators with permission can access
   */
  private async canAccessEvent(userId: string, event: any): Promise<boolean> {
    // Creator can always access
    if (event.created_by === userId) {
      return true;
    }

    // Check if user has collaborator access
    const { data: collaborator } = await this.supabaseService
      .getClient()
      .from('event_collaborators')
      .select('id, can_view_overview')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return collaborator?.can_view_overview === true;
  }

  /**
   * Check if user can update event
   * NEW: Only creator or collaborators with edit permission
   */
  private async canUpdateEvent(userId: string, event: any): Promise<boolean> {
    // Creator can always update
    if (event.created_by === userId) {
      return true;
    }

    // Check if user has edit permission
    const { data: collaborator } = await this.supabaseService
      .getClient()
      .from('event_collaborators')
      .select('id, can_edit_details')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return collaborator?.can_edit_details === true;
  }

  /**
   * Check if user can delete event
   * NEW: Only creator can delete
   */
  private async canDeleteEvent(userId: string, event: any): Promise<boolean> {
    // Only creator can delete events
    return event.created_by === userId;
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
