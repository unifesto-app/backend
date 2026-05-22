import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';

/**
 * Service to sync organization_members with user_access table
 * Implements hybrid approach: organization_members for basic membership,
 * user_access for advanced RBAC
 */
@Injectable()
export class OrgMemberSyncService {
  private readonly logger = new Logger(OrgMemberSyncService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Map relationship_type to role_code
   */
  private mapRelationshipToRoleCode(relationshipType: string): string {
    const mapping: Record<string, string> = {
      owner: 'ORG_OWNER',
      admin: 'ORG_ADMIN',
      member: 'ORG_MEMBER',
    };
    return mapping[relationshipType] || 'ORG_MEMBER';
  }

  /**
   * Map role_code back to relationship_type
   */
  mapRoleCodeToRelationship(roleCode: string): string {
    const mapping: Record<string, string> = {
      ORG_OWNER: 'owner',
      ORG_ADMIN: 'admin',
      ORG_MEMBER: 'member',
    };
    return mapping[roleCode] || 'member';
  }

  /**
   * Sync a single organization member to user_access
   */
  async syncMemberToUserAccess(
    userId: string,
    organizationId: string,
    relationshipType: string,
    isActive: boolean = true,
    grantedBy?: string,
  ): Promise<void> {
    try {
      const roleCode = this.mapRelationshipToRoleCode(relationshipType);

      // Get role_id
      const { data: role, error: roleError } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .select('id')
        .eq('code', roleCode)
        .single();

      if (roleError || !role) {
        this.logger.error(`Role ${roleCode} not found: ${roleError?.message}`);
        return;
      }

      // Insert or update user_access
      const { error: upsertError } = await this.supabaseService
        .getClient()
        .from('user_access')
        .upsert(
          {
            user_id: userId,
            role_id: role.id,
            role_scope: 'organization',
            organization_id: organizationId,
            status: isActive ? 'active' : 'inactive',
            granted_by: grantedBy,
            metadata: {
              source: 'organization_members',
              relationship_type: relationshipType,
              synced_at: new Date().toISOString(),
            },
          },
          {
            onConflict: 'user_id,role_id,organization_id',
            ignoreDuplicates: false,
          },
        );

      if (upsertError) {
        this.logger.error(
          `Error syncing member to user_access: ${upsertError.message}`,
        );
      } else {
        this.logger.log(
          `Synced member ${userId} to org ${organizationId} with role ${roleCode}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error in syncMemberToUserAccess: ${error.message}`);
    }
  }

  /**
   * Remove user_access record when organization member is removed
   */
  async removeMemberFromUserAccess(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('user_access')
        .update({
          deleted_at: new Date().toISOString(),
          status: 'inactive',
        })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

      if (error) {
        this.logger.error(
          `Error removing member from user_access: ${error.message}`,
        );
      } else {
        this.logger.log(
          `Removed member ${userId} from org ${organizationId} in user_access`,
        );
      }
    } catch (error) {
      this.logger.error(`Error in removeMemberFromUserAccess: ${error.message}`);
    }
  }

  /**
   * Get organization role from user_access (for display purposes)
   */
  async getOrgRoleFromUserAccess(
    userId: string,
    organizationId: string,
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_access')
        .select(
          `
          access_roles!inner(code)
        `,
        )
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return (data as any).access_roles.code;
    } catch (error) {
      this.logger.error(`Error in getOrgRoleFromUserAccess: ${error.message}`);
      return null;
    }
  }

  /**
   * Sync all existing organization members to user_access
   * Useful for initial migration or data repair
   */
  async syncAllMembers(): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const { data: members, error } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('user_id, organization_id, relationship_type, is_active, invited_by')
        .is('deleted_at', null);

      if (error) {
        this.logger.error(`Error fetching members: ${error.message}`);
        return { synced, errors: 1 };
      }

      for (const member of members || []) {
        try {
          await this.syncMemberToUserAccess(
            member.user_id,
            member.organization_id,
            member.relationship_type,
            member.is_active,
            member.invited_by,
          );
          synced++;
        } catch (err) {
          this.logger.error(`Error syncing member: ${err.message}`);
          errors++;
        }
      }

      this.logger.log(`Sync complete: ${synced} synced, ${errors} errors`);
    } catch (error) {
      this.logger.error(`Error in syncAllMembers: ${error.message}`);
      errors++;
    }

    return { synced, errors };
  }
}
