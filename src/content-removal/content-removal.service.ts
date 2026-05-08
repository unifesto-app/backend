import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateRemovalRequestDto } from './dto/create-removal-request.dto';
import { ProcessRemovalRequestDto } from './dto/process-removal-request.dto';

@Injectable()
export class ContentRemovalService {
  private readonly logger = new Logger(ContentRemovalService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Create content removal request
   */
  async createRequest(userId: string, createDto: CreateRemovalRequestDto) {
    try {
      // Validate action and transfer_to_user_id
      if (createDto.action === 'transfer' && !createDto.transfer_to_user_id) {
        throw new BadRequestException(
          'transfer_to_user_id is required for transfer action',
        );
      }

      // Verify content exists and belongs to user
      const contentExists = await this.verifyContentOwnership(
        userId,
        createDto.content_type,
        createDto.content_id,
      );

      if (!contentExists) {
        throw new NotFoundException('Content not found or not owned by user');
      }

      // Create removal request
      const { data: request, error } = await this.supabaseService
        .getClient()
        .from('content_removal_requests')
        .insert({
          user_id: userId,
          organization_id: createDto.organization_id,
          content_type: createDto.content_type,
          content_id: createDto.content_id,
          action: createDto.action,
          transfer_to_user_id: createDto.transfer_to_user_id || null,
          notes: createDto.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating removal request: ${error.message}`);
        throw new BadRequestException('Failed to create removal request');
      }

      this.logger.log(
        `Content removal request created: ${request.id} by user ${userId}`,
      );
      return request;
    } catch (error) {
      this.logger.error(`Error in createRequest: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get removal requests
   */
  async getRequests(userId: string, orgId?: string, status?: string) {
    try {
      // Check if user is admin (can see all requests) or regular user (can see own)
      let query = this.supabaseService
        .getClient()
        .from('content_removal_requests')
        .select(`
          *,
          user:profiles!user_id(id, name, email, avatar_url),
          organization:organizations(id, name, slug)
        `);

      // If orgId provided, check if user is admin
      if (orgId) {
        const canManage = await this.permissionsService.canManageMembers(
          userId,
          orgId,
        );

        if (canManage) {
          // Admin can see all requests for this org
          query = query.eq('organization_id', orgId);
        } else {
          // Regular user can only see their own
          query = query.eq('user_id', userId).eq('organization_id', orgId);
        }
      } else {
        // No orgId - user can only see their own requests
        query = query.eq('user_id', userId);
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data: requests, error } = await query;

      if (error) {
        this.logger.error(`Error fetching removal requests: ${error.message}`);
        throw new BadRequestException('Failed to fetch removal requests');
      }

      return requests || [];
    } catch (error) {
      this.logger.error(`Error in getRequests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process removal request (approve/reject)
   */
  async processRequest(
    userId: string,
    requestId: string,
    processDto: ProcessRemovalRequestDto,
  ) {
    try {
      // Get request
      const { data: request } = await this.supabaseService
        .getClient()
        .from('content_removal_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) {
        throw new NotFoundException('Removal request not found');
      }

      // Check if user can manage members in this org
      const canManage = await this.permissionsService.canManageMembers(
        userId,
        request.organization_id,
      );

      if (!canManage) {
        throw new ForbiddenException('Cannot process this removal request');
      }

      // Check current status
      if (request.status !== 'pending') {
        throw new BadRequestException(
          `Cannot process request with status: ${request.status}`,
        );
      }

      // Update request status
      const { data: updated, error: updateError } = await this.supabaseService
        .getClient()
        .from('content_removal_requests')
        .update({
          status: processDto.status,
          processed_by: userId,
          processed_at: new Date().toISOString(),
          notes: processDto.notes || request.notes,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        this.logger.error(`Error processing request: ${updateError.message}`);
        throw new BadRequestException('Failed to process removal request');
      }

      // If approved, execute the action
      if (processDto.status === 'approved') {
        await this.executeRemovalAction(request);

        // Mark as completed
        await this.supabaseService
          .getClient()
          .from('content_removal_requests')
          .update({ status: 'completed' })
          .eq('id', requestId);
      }

      this.logger.log(
        `Removal request processed: ${requestId} by user ${userId} - ${processDto.status}`,
      );
      return updated;
    } catch (error) {
      this.logger.error(`Error in processRequest: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify content ownership
   */
  private async verifyContentOwnership(
    userId: string,
    contentType: string,
    contentId: string,
  ): Promise<boolean> {
    try {
      if (contentType === 'event') {
        const { data: event } = await this.supabaseService
          .getClient()
          .from('events')
          .select('created_by')
          .eq('id', contentId)
          .single();

        return event?.created_by === userId;
      }

      // Add other content types as needed
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute removal action
   */
  private async executeRemovalAction(request: any) {
    try {
      if (request.content_type === 'event') {
        switch (request.action) {
          case 'transfer':
            // Transfer event ownership
            await this.supabaseService
              .getClient()
              .from('events')
              .update({
                created_by: request.transfer_to_user_id,
                ownership_status: 'transferred',
              })
              .eq('id', request.content_id);
            break;

          case 'delete':
            // Delete event
            await this.supabaseService
              .getClient()
              .from('events')
              .delete()
              .eq('id', request.content_id);
            break;

          case 'anonymize':
            // Anonymize event (remove creator reference)
            await this.supabaseService
              .getClient()
              .from('events')
              .update({
                created_by: null,
                ownership_status: 'anonymized',
              })
              .eq('id', request.content_id);
            break;
        }

        this.logger.log(
          `Content removal action executed: ${request.action} for ${request.content_type} ${request.content_id}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error executing removal action: ${error.message}`);
      throw error;
    }
  }
}
