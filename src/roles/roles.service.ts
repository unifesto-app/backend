import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get all access roles
   */
  async findAll(userId: string) {
    try {
      const { data: roles, error } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .select('*')
        .is('deleted_at', null)
        .order('scope', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        this.logger.error(`Error fetching roles: ${error.message}`);
        throw new BadRequestException('Failed to fetch roles');
      }

      return { roles: roles || [] };
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single role by ID
   */
  async findOne(userId: string, roleId: string) {
    try {
      const { data: role, error } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .select('*')
        .eq('id', roleId)
        .is('deleted_at', null)
        .single();

      if (error || !role) {
        throw new NotFoundException('Role not found');
      }

      return { role };
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new role
   */
  async create(userId: string, dto: CreateRoleDto) {
    try {
      // Check if code already exists
      const { data: existing } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .select('id')
        .eq('code', dto.code.toUpperCase())
        .is('deleted_at', null)
        .single();

      if (existing) {
        throw new BadRequestException('Role code already exists');
      }

      // Create role
      const { data: role, error } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .insert({
          name: dto.name,
          code: dto.code.toUpperCase(),
          scope: dto.scope,
          description: dto.description,
          is_system: false,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating role: ${error.message}`);
        throw new BadRequestException('Failed to create role');
      }

      this.logger.log(`Role created: ${role.id} by user ${userId}`);
      return { role };
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update role
   */
  async update(userId: string, roleId: string, dto: UpdateRoleDto) {
    try {
      // Get existing role
      const { data: existingRole } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .select('*')
        .eq('id', roleId)
        .is('deleted_at', null)
        .single();

      if (!existingRole) {
        throw new NotFoundException('Role not found');
      }

      // Prevent updating system roles
      if (existingRole.is_system) {
        throw new ForbiddenException('Cannot update system roles');
      }

      // If updating code, check uniqueness
      if (dto.code && dto.code.toUpperCase() !== existingRole.code) {
        const { data: codeExists } = await this.supabaseService
          .getClient()
          .from('access_roles')
          .select('id')
          .eq('code', dto.code.toUpperCase())
          .neq('id', roleId)
          .is('deleted_at', null)
          .single();

        if (codeExists) {
          throw new BadRequestException('Role code already exists');
        }
      }

      // Update role
      const { data: role, error } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .update({
          ...(dto.name && { name: dto.name }),
          ...(dto.code && { code: dto.code.toUpperCase() }),
          ...(dto.scope && { scope: dto.scope }),
          ...(dto.description !== undefined && { description: dto.description }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating role: ${error.message}`);
        throw new BadRequestException('Failed to update role');
      }

      this.logger.log(`Role updated: ${roleId} by user ${userId}`);
      return { role };
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`);
      throw error;
    }
  }

  /**
   * Soft delete role
   */
  async remove(userId: string, roleId: string) {
    try {
      // Get existing role
      const { data: existingRole } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .select('*')
        .eq('id', roleId)
        .is('deleted_at', null)
        .single();

      if (!existingRole) {
        throw new NotFoundException('Role not found');
      }

      // Prevent deleting system roles
      if (existingRole.is_system) {
        throw new ForbiddenException('Cannot delete system roles');
      }

      // Check if role is in use
      const { data: usersWithRole } = await this.supabaseService
        .getClient()
        .from('user_access')
        .select('id')
        .eq('role_id', roleId)
        .is('deleted_at', null)
        .limit(1);

      if (usersWithRole && usersWithRole.length > 0) {
        throw new BadRequestException(
          'Cannot delete role that is assigned to users',
        );
      }

      // Soft delete
      const { error } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId);

      if (error) {
        this.logger.error(`Error deleting role: ${error.message}`);
        throw new BadRequestException('Failed to delete role');
      }

      this.logger.log(`Role deleted: ${roleId} by user ${userId}`);
      return { message: 'Role deleted successfully' };
    } catch (error) {
      this.logger.error(`Error in remove: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get roles by scope
   */
  async findByScope(userId: string, scope: string) {
    try {
      const { data: roles, error } = await this.supabaseService
        .getClient()
        .from('access_roles')
        .select('*')
        .eq('scope', scope)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) {
        this.logger.error(`Error fetching roles by scope: ${error.message}`);
        throw new BadRequestException('Failed to fetch roles');
      }

      return { roles: roles || [] };
    } catch (error) {
      this.logger.error(`Error in findByScope: ${error.message}`);
      throw error;
    }
  }
}
