import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationQueryDto } from './dto/organization-query.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Get all organizations accessible by user
   */
  async findAll(userId: string, query: OrganizationQueryDto) {
    try {
      const accessibleOrgs = await this.permissionsService.getUserAccessibleOrgs(
        userId,
        query.role as any,
      );

      if (accessibleOrgs.length === 0) {
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
        .from('organizations')
        .select('*, member_count:organization_members(count)', { count: 'exact' })
        .in('id', orgIds);

      // Apply filters
      if (query.type) {
        dbQuery = dbQuery.eq('type', query.type);
      }

      if (query.is_active !== undefined) {
        dbQuery = dbQuery.eq('is_active', query.is_active);
      }

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      dbQuery = dbQuery.range(from, to);

      const { data, error, count } = await dbQuery;

      if (error) {
        this.logger.error(`Error fetching organizations: ${error.message}`);
        throw new BadRequestException('Failed to fetch organizations');
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
   * Get organization by ID
   */
  async findOne(userId: string, orgId: string) {
    try {
      // Check access
      const hasAccess = await this.permissionsService.hasHierarchyAccess(
        userId,
        orgId,
      );

      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this organization');
      }

      const { data: org, error } = await this.supabaseService
        .getClient()
        .from('organizations')
        .select(`
          *,
          parent_org:parent_org_id(id, name, type, slug),
          member_count:organization_members(count),
          sub_org_count:organizations!parent_org_id(count)
        `)
        .eq('id', orgId)
        .single();

      if (error || !org) {
        throw new NotFoundException('Organization not found');
      }

      // Get organization path (breadcrumb)
      const { data: orgPath } = await this.supabaseService
        .getClient()
        .rpc('get_organization_path', { org_id: orgId });

      return {
        ...org,
        org_path: orgPath || [],
      };
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new organization
   */
  async create(userId: string, createDto: CreateOrganizationDto) {
    try {
      // Check if slug is unique
      const { data: existing } = await this.supabaseService
        .getClient()
        .from('organizations')
        .select('id')
        .eq('slug', createDto.slug)
        .single();

      if (existing) {
        throw new BadRequestException('Organization slug already exists');
      }

      // If creating sub-org, check parent access
      if (createDto.parent_org_id) {
        const canManage = await this.permissionsService.canManageOrg(
          userId,
          createDto.parent_org_id,
        );

        if (!canManage) {
          throw new ForbiddenException(
            'Cannot create sub-organization under this parent',
          );
        }
      } else {
        // Creating root org - only platform admin can do this
        const isPlatformAdmin = await this.permissionsService.isPlatformSuperAdmin(
          userId,
        );

        if (!isPlatformAdmin) {
          throw new ForbiddenException(
            'Only platform admins can create root organizations',
          );
        }
      }

      // Create organization
      const { data: newOrg, error } = await this.supabaseService
        .getClient()
        .from('organizations')
        .insert({
          ...createDto,
          super_admin_id: createDto.parent_org_id ? null : userId, // Set super admin for root orgs
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating organization: ${error.message}`);
        throw new BadRequestException('Failed to create organization');
      }

      // If root org, add creator as owner
      if (!createDto.parent_org_id) {
        await this.supabaseService
          .getClient()
          .from('organization_members')
          .insert({
            organization_id: newOrg.id,
            user_id: userId,
            role: 'owner',
            can_manage_sub_orgs: true,
            can_approve_events: true,
            can_view_analytics: true,
            can_export_reports: true,
            analytics_scope: 'hierarchy',
          });
      }

      this.logger.log(`Organization created: ${newOrg.id} by user ${userId}`);
      return newOrg;
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update organization
   */
  async update(userId: string, orgId: string, updateDto: UpdateOrganizationDto) {
    try {
      // Check permissions
      const canManage = await this.permissionsService.canManageOrg(userId, orgId);

      if (!canManage) {
        throw new ForbiddenException('Cannot update this organization');
      }

      // If updating slug, check uniqueness
      if ((updateDto as any).slug) {
        const { data: existing } = await this.supabaseService
          .getClient()
          .from('organizations')
          .select('id')
          .eq('slug', (updateDto as any).slug)
          .neq('id', orgId)
          .single();

        if (existing) {
          throw new BadRequestException('Organization slug already exists');
        }
      }

      const { data: updated, error } = await this.supabaseService
        .getClient()
        .from('organizations')
        .update(updateDto)
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating organization: ${error.message}`);
        throw new BadRequestException('Failed to update organization');
      }

      this.logger.log(`Organization updated: ${orgId} by user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete organization (soft delete)
   */
  async remove(userId: string, orgId: string) {
    try {
      // Check permissions - only super admin or platform admin
      const permissions = await this.permissionsService.getOrgPermissions(
        userId,
        orgId,
      );

      const canDelete =
        permissions.accessType === 'platform' ||
        (permissions.role === 'owner' && permissions.accessType === 'direct');

      if (!canDelete) {
        throw new ForbiddenException('Cannot delete this organization');
      }

      // Soft delete by setting is_active to false
      const { error } = await this.supabaseService
        .getClient()
        .from('organizations')
        .update({ is_active: false })
        .eq('id', orgId);

      if (error) {
        this.logger.error(`Error deleting organization: ${error.message}`);
        throw new BadRequestException('Failed to delete organization');
      }

      this.logger.log(`Organization deleted: ${orgId} by user ${userId}`);
      return { message: 'Organization deleted successfully' };
    } catch (error) {
      this.logger.error(`Error in remove: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get organization hierarchy
   */
  async getHierarchy(userId: string, orgId: string) {
    try {
      // Check access
      const hasAccess = await this.permissionsService.hasHierarchyAccess(
        userId,
        orgId,
      );

      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this organization');
      }

      // Get hierarchy (children)
      const { data: hierarchy, error } = await this.supabaseService
        .getClient()
        .rpc('get_organization_hierarchy', { org_id: orgId });

      if (error) {
        this.logger.error(`Error getting hierarchy: ${error.message}`);
        throw new BadRequestException('Failed to get organization hierarchy');
      }

      return hierarchy || [];
    } catch (error) {
      this.logger.error(`Error in getHierarchy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's permissions for organization
   */
  async getPermissions(userId: string, orgId: string) {
    try {
      const permissions = await this.permissionsService.getOrgPermissions(
        userId,
        orgId,
      );

      return { permissions };
    } catch (error) {
      this.logger.error(`Error in getPermissions: ${error.message}`);
      throw error;
    }
  }
}
