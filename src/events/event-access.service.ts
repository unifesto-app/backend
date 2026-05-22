import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { GrantAccessDto } from './dto/grant-access.dto';
import { RequestAccessDto } from './dto/request-access.dto';
import { ProcessAccessRequestDto } from './dto/process-access-request.dto';

@Injectable()
export class EventAccessService {
  private readonly logger = new Logger(EventAccessService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get user's permissions for an event
   */
  async getUserEventPermissions(userId: string, eventId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('get_user_event_permissions', {
          p_user_id: userId,
          p_event_id: eventId,
        });

      if (error) {
        this.logger.error(`Error getting event permissions: ${error.message}`);
        throw new BadRequestException('Failed to get event permissions');
      }

      return data || {};
    } catch (error) {
      this.logger.error(`Error in getUserEventPermissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user can manage event (creator or has edit permissions)
   */
  async canManageEvent(userId: string, eventId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('can_manage_event', {
          p_user_id: userId,
          p_event_id: eventId,
        });

      if (error) {
        this.logger.error(`Error checking manage permission: ${error.message}`);
        return false;
      }

      return data === true;
    } catch (error) {
      this.logger.error(`Error in canManageEvent: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all collaborators for an event
   */
  async getEventCollaborators(userId: string, eventId: string) {
    try {
      // Check if user is creator or has manage_access permission
      const canView = await this.canViewCollaborators(userId, eventId);
      if (!canView) {
        throw new ForbiddenException('Cannot view event collaborators');
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .select(`
          *,
          user:profiles!user_id(id, name, email, avatar_url),
          granted_by_user:profiles!granted_by(id, name, email)
        `)
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching collaborators: ${error.message}`);
        throw new BadRequestException('Failed to fetch collaborators');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error in getEventCollaborators: ${error.message}`);
      throw error;
    }
  }

  /**
   * Grant access to a user
   */
  async grantAccess(
    userId: string,
    eventId: string,
    grantDto: GrantAccessDto,
  ) {
    try {
      // Check if user is creator or has manage_access permission
      const canGrant = await this.canManageAccess(userId, eventId);
      if (!canGrant) {
        throw new ForbiddenException('Cannot grant access to this event');
      }

      // Check if event exists
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('id, created_by, organization_id')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Cannot grant access to creator
      if (grantDto.user_id === event.created_by) {
        throw new BadRequestException('Cannot grant access to event creator');
      }

      // Cannot grant access to self
      if (grantDto.user_id === userId) {
        throw new BadRequestException('Cannot grant access to yourself');
      }

      // Check if user exists and is in the same organization
      const { data: targetUser } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('user_id')
        .eq('user_id', grantDto.user_id)
        .eq('organization_id', event.organization_id)
        .single();

      if (!targetUser) {
        throw new BadRequestException(
          'User not found or not a member of the event organization',
        );
      }

      // Check if collaborator already exists
      const { data: existing } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .select('id, is_active')
        .eq('event_id', eventId)
        .eq('user_id', grantDto.user_id)
        .single();

      if (existing) {
        if (existing.is_active) {
          // Update existing active collaborator
          const { data: updated, error } = await this.supabaseService
            .getClient()
            .from('event_collaborators')
            .update({
              ...grantDto,
              granted_by: userId,
              granted_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) {
            this.logger.error(`Error updating collaborator: ${error.message}`);
            throw new BadRequestException('Failed to update collaborator');
          }

          // Log audit
          await this.logAccessAudit(
            eventId,
            grantDto.user_id,
            'access_modified',
            userId,
            { permissions: grantDto },
          );

          this.logger.log(
            `Access updated for user ${grantDto.user_id} on event ${eventId}`,
          );
          return updated;
        } else {
          // Reactivate inactive collaborator
          const { data: reactivated, error } = await this.supabaseService
            .getClient()
            .from('event_collaborators')
            .update({
              ...grantDto,
              granted_by: userId,
              granted_at: new Date().toISOString(),
              is_active: true,
              revoked_at: null,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) {
            this.logger.error(
              `Error reactivating collaborator: ${error.message}`,
            );
            throw new BadRequestException('Failed to reactivate collaborator');
          }

          // Log audit
          await this.logAccessAudit(
            eventId,
            grantDto.user_id,
            'access_granted',
            userId,
            { permissions: grantDto },
          );

          this.logger.log(
            `Access reactivated for user ${grantDto.user_id} on event ${eventId}`,
          );
          return reactivated;
        }
      }

      // Create new collaborator
      const { data: newCollaborator, error } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .insert({
          event_id: eventId,
          granted_by: userId,
          ...grantDto,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating collaborator: ${error.message}`);
        throw new BadRequestException('Failed to grant access');
      }

      // Log audit
      await this.logAccessAudit(
        eventId,
        grantDto.user_id,
        'access_granted',
        userId,
        { permissions: grantDto },
      );

      this.logger.log(
        `Access granted to user ${grantDto.user_id} on event ${eventId}`,
      );
      return newCollaborator;
    } catch (error) {
      this.logger.error(`Error in grantAccess: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revoke access from a user
   */
  async revokeAccess(userId: string, eventId: string, targetUserId: string) {
    try {
      // Check if user is creator or has manage_access permission
      const canRevoke = await this.canManageAccess(userId, eventId);
      if (!canRevoke) {
        throw new ForbiddenException('Cannot revoke access to this event');
      }

      // Get collaborator
      const { data: collaborator } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .single();

      if (!collaborator) {
        throw new NotFoundException('Collaborator not found');
      }

      // Revoke access (soft delete)
      const { error } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', collaborator.id);

      if (error) {
        this.logger.error(`Error revoking access: ${error.message}`);
        throw new BadRequestException('Failed to revoke access');
      }

      // Log audit
      await this.logAccessAudit(
        eventId,
        targetUserId,
        'access_revoked',
        userId,
      );

      this.logger.log(
        `Access revoked from user ${targetUserId} on event ${eventId}`,
      );
      return { message: 'Access revoked successfully' };
    } catch (error) {
      this.logger.error(`Error in revokeAccess: ${error.message}`);
      throw error;
    }
  }

  /**
   * Request access to an event
   */
  async requestAccess(
    userId: string,
    eventId: string,
    requestDto: RequestAccessDto,
  ) {
    try {
      // Check if event exists
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('id, created_by, title')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Cannot request access to own event
      if (event.created_by === userId) {
        throw new BadRequestException('Cannot request access to your own event');
      }

      // Check if already has access
      const { data: existing } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (existing) {
        throw new BadRequestException('You already have access to this event');
      }

      // Check if pending request exists
      const { data: pendingRequest } = await this.supabaseService
        .getClient()
        .from('event_access_requests')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (pendingRequest) {
        throw new BadRequestException(
          'You already have a pending access request for this event',
        );
      }

      // Create access request
      const { data: newRequest, error } = await this.supabaseService
        .getClient()
        .from('event_access_requests')
        .insert({
          event_id: eventId,
          user_id: userId,
          requested_permissions: requestDto.requested_permissions,
          reason: requestDto.reason,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating access request: ${error.message}`);
        throw new BadRequestException('Failed to create access request');
      }

      // Log audit
      await this.logAccessAudit(eventId, userId, 'access_requested', userId, {
        permissions: requestDto.requested_permissions,
        reason: requestDto.reason,
      });

      this.logger.log(`Access requested by user ${userId} for event ${eventId}`);
      return newRequest;
    } catch (error) {
      this.logger.error(`Error in requestAccess: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get access requests for an event
   */
  async getAccessRequests(userId: string, eventId: string, status?: string) {
    try {
      // Check if user is creator or has manage_access permission
      const canView = await this.canManageAccess(userId, eventId);
      if (!canView) {
        throw new ForbiddenException('Cannot view access requests');
      }

      let query = this.supabaseService
        .getClient()
        .from('event_access_requests')
        .select(`
          *,
          user:profiles!user_id(id, name, email, avatar_url),
          processed_by_user:profiles!processed_by(id, name, email)
        `)
        .eq('event_id', eventId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('requested_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        this.logger.error(`Error fetching access requests: ${error.message}`);
        throw new BadRequestException('Failed to fetch access requests');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error in getAccessRequests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process an access request (approve/reject)
   */
  async processAccessRequest(
    userId: string,
    requestId: string,
    processDto: ProcessAccessRequestDto,
  ) {
    try {
      // Get request
      const { data: request } = await this.supabaseService
        .getClient()
        .from('event_access_requests')
        .select('*, event:events(id, created_by)')
        .eq('id', requestId)
        .single();

      if (!request) {
        throw new NotFoundException('Access request not found');
      }

      if (request.status !== 'pending') {
        throw new BadRequestException('Request has already been processed');
      }

      // Check if user can process requests
      const canProcess = await this.canManageAccess(userId, request.event_id);
      if (!canProcess) {
        throw new ForbiddenException('Cannot process access requests');
      }

      // Update request status
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('event_access_requests')
        .update({
          status: processDto.status,
          processed_by: userId,
          processed_at: new Date().toISOString(),
          response_message: processDto.response_message,
        })
        .eq('id', requestId);

      if (updateError) {
        this.logger.error(`Error updating request: ${updateError.message}`);
        throw new BadRequestException('Failed to process request');
      }

      // If approved, grant access
      if (processDto.status === 'approved') {
        const requestedPermissions = (request.requested_permissions as Record<string, any>) || {};
        await this.grantAccess(userId, request.event_id, {
          user_id: request.user_id,
          ...requestedPermissions,
        });
      }

      // Log audit
      await this.logAccessAudit(
        request.event_id,
        request.user_id,
        processDto.status === 'approved'
          ? 'request_approved'
          : 'request_rejected',
        userId,
        { response_message: processDto.response_message },
      );

      this.logger.log(
        `Access request ${requestId} ${processDto.status} by user ${userId}`,
      );
      return { message: `Request ${processDto.status} successfully` };
    } catch (error) {
      this.logger.error(`Error in processAccessRequest: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel an access request
   */
  async cancelAccessRequest(userId: string, requestId: string) {
    try {
      // Get request
      const { data: request } = await this.supabaseService
        .getClient()
        .from('event_access_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) {
        throw new NotFoundException('Access request not found');
      }

      if (request.user_id !== userId) {
        throw new ForbiddenException('Cannot cancel this request');
      }

      if (request.status !== 'pending') {
        throw new BadRequestException('Can only cancel pending requests');
      }

      // Update status
      const { error } = await this.supabaseService
        .getClient()
        .from('event_access_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) {
        this.logger.error(`Error cancelling request: ${error.message}`);
        throw new BadRequestException('Failed to cancel request');
      }

      // Log audit
      await this.logAccessAudit(
        request.event_id,
        userId,
        'request_cancelled',
        userId,
      );

      this.logger.log(`Access request ${requestId} cancelled by user ${userId}`);
      return { message: 'Request cancelled successfully' };
    } catch (error) {
      this.logger.error(`Error in cancelAccessRequest: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get access audit log for an event
   */
  async getAccessAuditLog(userId: string, eventId: string) {
    try {
      // Check if user is creator or has manage_access permission
      const canView = await this.canManageAccess(userId, eventId);
      if (!canView) {
        throw new ForbiddenException('Cannot view access audit log');
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('event_access_audit_log')
        .select(`
          *,
          user:profiles!user_id(id, name, email),
          performed_by_user:profiles!performed_by(id, name, email)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        this.logger.error(`Error fetching audit log: ${error.message}`);
        throw new BadRequestException('Failed to fetch audit log');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error in getAccessAuditLog: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper: Check if user can view collaborators
   */
  private async canViewCollaborators(
    userId: string,
    eventId: string,
  ): Promise<boolean> {
    const { data: event } = await this.supabaseService
      .getClient()
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();

    if (!event) return false;
    if (event.created_by === userId) return true;

    const { data: collaborator } = await this.supabaseService
      .getClient()
      .from('event_collaborators')
      .select('can_manage_access')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return collaborator?.can_manage_access === true;
  }

  /**
   * Helper: Check if user can manage access
   */
  private async canManageAccess(
    userId: string,
    eventId: string,
  ): Promise<boolean> {
    const { data: event } = await this.supabaseService
      .getClient()
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();

    if (!event) return false;
    if (event.created_by === userId) return true;

    const { data: collaborator } = await this.supabaseService
      .getClient()
      .from('event_collaborators')
      .select('can_manage_access')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return collaborator?.can_manage_access === true;
  }

  /**
   * Helper: Log access audit
   */
  private async logAccessAudit(
    eventId: string,
    targetUserId: string,
    action: string,
    performedBy: string,
    details?: any,
  ) {
    try {
      await this.supabaseService
        .getClient()
        .from('event_access_audit_log')
        .insert({
          event_id: eventId,
          user_id: targetUserId,
          action,
          performed_by: performedBy,
          details: details || null,
        });
    } catch (error) {
      this.logger.error(`Error logging audit: ${error.message}`);
      // Don't throw - audit logging is non-critical
    }
  }
}
