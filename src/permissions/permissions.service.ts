import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import {
  OrgPermissions,
  RelationshipType,
  PlatformRole,
  UserOrgAccess,
} from './interfaces/permission.interface';
import { RolesHelperService } from '../roles/roles-helper.service';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly rolesHelperService: RolesHelperService,
  ) {}

  /**
   * Check if user is Platform Super Admin
   */
  async isPlatformSuperAdmin(userId: string): Promise<boolean> {
    return this.rolesHelperService.isSuperAdmin(userId);
  }

  /**
   * Check if user has hierarchy access to organization
   */
  async hasHierarchyAccess(
    userId: string,
    orgId: string,
    requiredRole: RelationshipType = RelationshipType.MEMBER,
  ): Promise<boolean> {
    try {
      // Platform super admins have access to everything
      const isSuperAdmin = await this.isPlatformSuperAdmin(userId);
      if (isSuperAdmin) {
        return true;
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('user_has_hierarchy_access', {
          p_user_id: userId,
          p_org_id: orgId,
          p_required_relationship: requiredRole,
        });

      if (error) {
        this.logger.error(`Error checking hierarchy access: ${error.message}`);
        return false;
      }

      return data === true;
    } catch (error) {
      this.logger.error(`Error in hasHierarchyAccess: ${error.message}`);
      return false;
    }
  }

  /**
   * Get user's permissions for a specific organization
   */
  async getOrgPermissions(
    userId: string,
    orgId: string,
  ): Promise<OrgPermissions> {
    try {
      // Check if platform super admin
      const isPlatformAdmin = await this.isPlatformSuperAdmin(userId);
      if (isPlatformAdmin) {
        return {
          canManageOrg: true,
          canManageSubOrgs: true,
          canManageMembers: true,
          canCreateEvents: true,
          canManageEvents: true,
          canApproveEvents: true,
          canViewAnalytics: true,
          canExportReports: true,
          analyticsScope: 'hierarchy',
          eventScope: 'all',
          role: RelationshipType.OWNER,
          accessType: 'platform',
        };
      }

      // Check direct membership
      const { data: membership } = await this.supabaseService
        .getClient()
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .single();

      if (membership) {
        return this.buildPermissionsFromMembership(membership, 'direct');
      }

      // Check hierarchy access (Super Admin of parent org)
      const hasHierarchy = await this.hasHierarchyAccess(
        userId,
        orgId,
        RelationshipType.OWNER,
      );
      if (hasHierarchy) {
        return {
          canManageOrg: true,
          canManageSubOrgs: true,
          canManageMembers: true,
          canCreateEvents: true,
          canManageEvents: true,
          canApproveEvents: true,
          canViewAnalytics: true,
          canExportReports: true,
          analyticsScope: 'hierarchy',
          eventScope: 'all',
          role: RelationshipType.OWNER,
          accessType: 'hierarchy',
        };
      }

      // No access
      return {
        canManageOrg: false,
        canManageSubOrgs: false,
        canManageMembers: false,
        canCreateEvents: false,
        canManageEvents: false,
        canApproveEvents: false,
        canViewAnalytics: false,
        canExportReports: false,
        analyticsScope: 'none',
        eventScope: 'own',
        role: RelationshipType.MEMBER,
        accessType: 'direct',
      };
    } catch (error) {
      this.logger.error(`Error getting org permissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all organizations user has access to
   */
  async getUserAccessibleOrgs(
    userId: string,
    roleFilter?: RelationshipType,
  ): Promise<UserOrgAccess[]> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('get_user_accessible_orgs', {
          p_user_id: userId,
          p_relationship_filter: (roleFilter || null) as any, // Changed from p_role_filter
        });

      if (error) {
        this.logger.error(
          `Error getting accessible orgs: ${error.message}`,
        );
        return [];
      }

      return (data || []).map((org: any) => ({
        orgId: org.org_id,
        orgName: org.org_name,
        orgSlug: org.org_slug,
        orgType: org.org_type,
        userRole: org.user_relationship as RelationshipType, // Changed from user_role to user_relationship
        accessType: org.access_type as 'direct' | 'hierarchy',
        canManage: org.can_manage,
        depthLevel: org.depth_level,
      }));
    } catch (error) {
      this.logger.error(`Error getting accessible orgs: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if user can manage organization
   */
  async canManageOrg(userId: string, orgId: string): Promise<boolean> {
    const permissions = await this.getOrgPermissions(userId, orgId);
    return permissions.canManageOrg;
  }

  /**
   * Check if user can manage members
   */
  async canManageMembers(userId: string, orgId: string): Promise<boolean> {
    const permissions = await this.getOrgPermissions(userId, orgId);
    return permissions.canManageMembers;
  }

  /**
   * Check if user can approve events
   */
  async canApproveEvents(userId: string, orgId: string): Promise<boolean> {
    const permissions = await this.getOrgPermissions(userId, orgId);
    return permissions.canApproveEvents;
  }

  /**
   * Check if user can assign a specific role
   */
  async canAssignRole(
    userId: string,
    orgId: string,
    targetRole: RelationshipType,
  ): Promise<boolean> {
    const permissions = await this.getOrgPermissions(userId, orgId);

    // Platform admin can assign any role
    if (permissions.accessType === 'platform') {
      return true;
    }

    // Org Super Admin (owner) can assign admin or member
    if (permissions.role === RelationshipType.OWNER) {
      return targetRole !== RelationshipType.OWNER; // Cannot assign another owner
    }

    // Org Admin can assign member only
    if (permissions.role === RelationshipType.ADMIN) {
      return targetRole === RelationshipType.MEMBER;
    }

    // Members cannot assign roles
    return false;
  }

  /**
   * Build permissions object from membership data
   */
  private buildPermissionsFromMembership(
    membership: any,
    accessType: 'direct' | 'hierarchy',
  ): OrgPermissions {
    const role = membership.relationship_type as RelationshipType;

    switch (role) {
      case RelationshipType.OWNER:
        return {
          canManageOrg: true,
          canManageSubOrgs: true,
          canManageMembers: true,
          canCreateEvents: true,
          canManageEvents: true,
          canApproveEvents: true,
          canViewAnalytics: true,
          canExportReports: true,
          analyticsScope: 'hierarchy',
          eventScope: 'all',
          role,
          accessType,
        };

      case RelationshipType.ADMIN:
        return {
          canManageOrg: true,
          canManageSubOrgs: membership.can_manage_sub_orgs || true,
          canManageMembers: true,
          canCreateEvents: true,
          canManageEvents: true,
          canApproveEvents: membership.can_approve_events || true,
          canViewAnalytics: membership.can_view_analytics || true,
          canExportReports: membership.can_export_reports || true,
          analyticsScope: membership.analytics_scope || 'organization',
          eventScope: 'all',
          role,
          accessType,
        };

      case RelationshipType.MEMBER:
      default:
        return {
          canManageOrg: false,
          canManageSubOrgs: false,
          canManageMembers: false,
          canCreateEvents: true, // Members can create events
          canManageEvents: false, // But can only manage their own
          canApproveEvents: false,
          canViewAnalytics: false,
          canExportReports: false,
          analyticsScope: 'none',
          eventScope: 'own',
          role: RelationshipType.MEMBER,
          accessType,
        };
    }
  }
}
