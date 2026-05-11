import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { RelationshipType } from '../permissions/interfaces/permission.interface';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Get organization members
   */
  async findAll(userId: string, orgId: string, roleFilter?: string) {
    try {
      // Check access - members can view member list
      const hasAccess = await this.permissionsService.hasHierarchyAccess(
        userId,
        orgId,
        RelationshipType.MEMBER,
      );

      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this organization');
      }

      let query = this.supabaseService
        .getClient()
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId);

      if (roleFilter) {
        query = query.eq('relationship_type', roleFilter); // Changed from 'role' to 'relationship_type'
      }

      query = query.order('joined_at', { ascending: false });

      const { data: members, error } = await query;

      if (error) {
        this.logger.error(`Error fetching members: ${error.message}`);
        throw new BadRequestException('Failed to fetch members');
      }

      // Fetch profile data for each member
      const enrichedMembers = await Promise.all(
        (members || []).map(async (member) => {
          const { data: profile } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('id, name, email, username, avatar_url')
            .eq('id', member.user_id)
            .single();

          return {
            ...member,
            profile: profile || null,
          };
        }),
      );

      return enrichedMembers;
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add member to organization
   */
  async addMember(userId: string, orgId: string, addMemberDto: AddMemberDto) {
    try {
      // Check if user can manage members
      const canManage = await this.permissionsService.canManageMembers(
        userId,
        orgId,
      );

      if (!canManage) {
        throw new ForbiddenException('Cannot add members to this organization');
      }

      // Check if user can assign this role
      const canAssignRole = await this.permissionsService.canAssignRole(
        userId,
        orgId,
        addMemberDto.role as RelationshipType,
      );

      if (!canAssignRole) {
        throw new ForbiddenException(`Cannot assign role: ${addMemberDto.role}`);
      }

      // Check if user exists
      const { data: userProfile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id')
        .eq('id', addMemberDto.user_id)
        .single();

      if (!userProfile) {
        throw new NotFoundException('User not found');
      }

      // Check if already a member
      const { data: existing } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', addMemberDto.user_id)
        .single();

      if (existing) {
        throw new BadRequestException(
          'User is already a member of this organization',
        );
      }

      // Set default permissions based on role
      const defaultPermissions = this.getDefaultPermissions(
        addMemberDto.role as RelationshipType,
      );

      // Add member
      const { data: newMember, error } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: addMemberDto.user_id,
          relationship_type: addMemberDto.role, // Changed from 'role' to 'relationship_type'
          ...defaultPermissions,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error adding member: ${error.message}`);
        throw new BadRequestException('Failed to add member');
      }

      this.logger.log(
        `Member added: ${addMemberDto.user_id} to org ${orgId} by user ${userId}`,
      );
      return newMember;
    } catch (error) {
      this.logger.error(`Error in addMember: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    userId: string,
    orgId: string,
    memberId: string,
    updateDto: UpdateMemberRoleDto,
  ) {
    try {
      // Check if user can manage members
      const canManage = await this.permissionsService.canManageMembers(
        userId,
        orgId,
      );

      if (!canManage) {
        throw new ForbiddenException(
          'Cannot update members in this organization',
        );
      }

      // If updating role, check if user can assign it
      if (updateDto.role) {
        const canAssignRole = await this.permissionsService.canAssignRole(
          userId,
          orgId,
          updateDto.role as RelationshipType,
        );

        if (!canAssignRole) {
          throw new ForbiddenException(`Cannot assign role: ${updateDto.role}`);
        }
      }

      // Get current member
      const { data: currentMember } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('*')
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .single();

      if (!currentMember) {
        throw new NotFoundException('Member not found');
      }

      // Prevent self-demotion for owners
      if (currentMember.user_id === userId && currentMember.role === 'owner') {
        throw new ForbiddenException('Cannot change your own owner role');
      }

      // Build update object
      const updateData: any = {};
      if (updateDto.role) {
        updateData.relationship_type = updateDto.role; // Changed from 'role' to 'relationship_type'
        // Update default permissions for new role
        const defaultPermissions = this.getDefaultPermissions(
          updateDto.role as RelationshipType,
        );
        Object.assign(updateData, defaultPermissions);
      }

      // Update member
      const { data: updated, error } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .update(updateData)
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating member: ${error.message}`);
        throw new BadRequestException('Failed to update member');
      }

      this.logger.log(
        `Member updated: ${memberId} in org ${orgId} by user ${userId}`,
      );
      return updated;
    } catch (error) {
      this.logger.error(`Error in updateMemberRole: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(userId: string, orgId: string, memberId: string) {
    try {
      // Check if user can manage members
      const canManage = await this.permissionsService.canManageMembers(
        userId,
        orgId,
      );

      if (!canManage) {
        throw new ForbiddenException(
          'Cannot remove members from this organization',
        );
      }

      // Get member to remove
      const { data: member } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('*')
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .single();

      if (!member) {
        throw new NotFoundException('Member not found');
      }

      // Prevent self-removal for owners
      if (member.user_id === userId && member.role === 'owner') {
        throw new ForbiddenException('Cannot remove yourself as owner');
      }

      // Check if member has content (events)
      const { data: events, count } = await this.supabaseService
        .getClient()
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', member.user_id)
        .eq('organization_id', orgId);

      if (count && count > 0) {
        // Member has content - should trigger content removal workflow
        // For now, we'll just log it
        this.logger.warn(
          `Member ${member.user_id} has ${count} events. Content removal workflow should be triggered.`,
        );
        // TODO: Create content removal request
      }

      // Remove member
      const { error } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', orgId);

      if (error) {
        this.logger.error(`Error removing member: ${error.message}`);
        throw new BadRequestException('Failed to remove member');
      }

      this.logger.log(
        `Member removed: ${memberId} from org ${orgId} by user ${userId}`,
      );
      return { message: 'Member removed successfully', hadContent: (count || 0) > 0 };
    } catch (error) {
      this.logger.error(`Error in removeMember: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get default permissions for relationship type
   */
  private getDefaultPermissions(role: RelationshipType) {
    switch (role) {
      case RelationshipType.OWNER:
        return {
          can_manage_sub_orgs: true,
          can_approve_events: true,
          can_view_analytics: true,
          can_export_reports: true,
          analytics_scope: 'hierarchy',
        };
      case RelationshipType.ADMIN:
        return {
          can_manage_sub_orgs: true,
          can_approve_events: true,
          can_view_analytics: true,
          can_export_reports: true,
          analytics_scope: 'organization',
        };
      case RelationshipType.MEMBER:
      default:
        return {
          can_manage_sub_orgs: false,
          can_approve_events: false,
          can_view_analytics: false,
          can_export_reports: false,
          analytics_scope: 'none',
        };
    }
  }
}
