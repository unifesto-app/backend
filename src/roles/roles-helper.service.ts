import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';

/**
 * Helper service for checking user roles using the new access_roles system
 */
@Injectable()
export class RolesHelperService {
  private readonly logger = new Logger(RolesHelperService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Check if user has a specific role by code
   * Note: This function will be available after running migration 010
   */
  async userHasRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('user_has_role' as any, {
          p_user_id: userId,
          p_role_code: roleCode,
        });

      if (error) {
        this.logger.error(`Error checking user role: ${error.message}`);
        return false;
      }

      return data === true;
    } catch (error) {
      this.logger.error(`Error in userHasRole: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if user has role at or above certain scope
   * Note: This function will be available after running migration 010
   */
  async userHasScopeOrHigher(
    userId: string,
    scope: 'global' | 'platform' | 'organization' | 'event',
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('user_has_scope_or_higher' as any, {
          p_user_id: userId,
          p_scope: scope,
        });

      if (error) {
        this.logger.error(`Error checking user scope: ${error.message}`);
        return false;
      }

      return data === true;
    } catch (error) {
      this.logger.error(`Error in userHasScopeOrHigher: ${error.message}`);
      return false;
    }
  }

  /**
   * Get user's highest priority role
   * Note: This function will be available after running migration 010
   */
  async getUserHighestRole(userId: string): Promise<{
    role_id: string;
    role_code: string;
    role_name: string;
    role_scope: string;
  } | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('get_user_highest_role' as any, {
          p_user_id: userId,
        });

      if (error) {
        this.logger.error(`Error getting user highest role: ${error.message}`);
        return null;
      }

      return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (error) {
      this.logger.error(`Error in getUserHighestRole: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all active roles for a user
   */
  async getUserRoles(userId: string): Promise<
    Array<{
      role_id: string;
      role_code: string;
      role_name: string;
      role_scope: string;
      resource_id?: string;
      resource_type?: string;
    }>
  > {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_access')
        .select(
          `
          id,
          role_id,
          role_scope,
          resource_id,
          resource_type,
          access_roles!inner(
            id,
            code,
            name,
            scope
          )
        `,
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error) {
        this.logger.error(`Error getting user roles: ${error.message}`);
        return [];
      }

      return (data || []).map((item: any) => ({
        role_id: item.role_id,
        role_code: item.access_roles.code,
        role_name: item.access_roles.name,
        role_scope: item.access_roles.scope,
        resource_id: item.resource_id,
        resource_type: item.resource_type,
      }));
    } catch (error) {
      this.logger.error(`Error in getUserRoles: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if user is super admin (has SUPER_ADMIN or PLATFORM_ADMIN role)
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const hasSuperAdmin = await this.userHasRole(userId, 'SUPER_ADMIN');
    if (hasSuperAdmin) return true;

    const hasPlatformAdmin = await this.userHasRole(userId, 'PLATFORM_ADMIN');
    return hasPlatformAdmin;
  }

  /**
   * Check if user is org owner
   */
  async isOrgOwner(userId: string, orgId?: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId);
      
      if (!orgId) {
        // Check if user has ORG_OWNER role anywhere
        return roles.some(r => r.role_code === 'ORG_OWNER');
      }

      // Check if user has ORG_OWNER role for specific org
      return roles.some(
        r =>
          r.role_code === 'ORG_OWNER' &&
          r.resource_type === 'organization' &&
          r.resource_id === orgId,
      );
    } catch (error) {
      this.logger.error(`Error in isOrgOwner: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if user is org admin
   */
  async isOrgAdmin(userId: string, orgId?: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId);
      
      if (!orgId) {
        // Check if user has ORG_ADMIN role anywhere
        return roles.some(r => r.role_code === 'ORG_ADMIN');
      }

      // Check if user has ORG_ADMIN role for specific org
      return roles.some(
        r =>
          r.role_code === 'ORG_ADMIN' &&
          r.resource_type === 'organization' &&
          r.resource_id === orgId,
      );
    } catch (error) {
      this.logger.error(`Error in isOrgAdmin: ${error.message}`);
      return false;
    }
  }

  /**
   * Get user's legacy role for backward compatibility
   * Maps new access_roles to old platform_role enum values
   */
  async getUserLegacyRole(userId: string): Promise<string> {
    try {
      const highestRole = await this.getUserHighestRole(userId);
      
      if (!highestRole) {
        return 'attendee';
      }

      // Map new role codes to old platform_role values
      const roleMapping: Record<string, string> = {
        SUPER_ADMIN: 'super_admin',
        PLATFORM_ADMIN: 'super_admin',
        ORG_OWNER: 'org_super_admin',
        ORG_ADMIN: 'org_admin',
        ORG_ORGANIZER: 'organizer',
        EVENT_ORGANIZER: 'organizer',
        USER: 'attendee',
      };

      return roleMapping[highestRole.role_code] || 'attendee';
    } catch (error) {
      this.logger.error(`Error in getUserLegacyRole: ${error.message}`);
      return 'attendee';
    }
  }

  /**
   * Check if user can approve events based on role hierarchy
   */
  async canApproveEvents(userId: string, orgId: string): Promise<boolean> {
    // Super admins can approve anything
    if (await this.isSuperAdmin(userId)) {
      return true;
    }

    // Org owners can approve
    if (await this.isOrgOwner(userId, orgId)) {
      return true;
    }

    // Org admins can approve
    if (await this.isOrgAdmin(userId, orgId)) {
      return true;
    }

    return false;
  }
}
