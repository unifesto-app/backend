import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-field.dto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Check if user can manage tickets for an event
   */
  private async canManageTickets(userId: string, eventId: string): Promise<boolean> {
    // Check if user is event creator
    const { data: event } = await this.supabaseService
      .getClient()
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();

    if (event?.created_by === userId) {
      return true;
    }

    // Check if user is collaborator with ticket management permission
    const { data: collaborator } = await this.supabaseService
      .getClient()
      .from('event_collaborators')
      .select('permissions')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // Check if 'manage_tickets' is in the permissions array
    return collaborator?.permissions?.includes('manage_tickets') === true;
  }

  // ==========================================
  // TICKETS CRUD
  // ==========================================

  /**
   * Get all tickets for an event
   */
  async getTickets(userId: string, eventId: string) {
    try {
      const canManage = await this.canManageTickets(userId, eventId);

      let query = this.supabaseService
        .getClient()
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      // If user can't manage, only show public tickets
      if (!canManage) {
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error(`Error fetching tickets: ${error.message}`);
        throw new BadRequestException('Failed to fetch tickets');
      }

      return { tickets: data || [] };
    } catch (error) {
      this.logger.error(`Error in getTickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single ticket by ID
   */
  async getTicket(userId: string, eventId: string, ticketId: string) {
    try {
      const { data: ticket, error } = await this.supabaseService
        .getClient()
        .from('event_tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('event_id', eventId)
        .single();

      if (error || !ticket) {
        throw new NotFoundException('Ticket not found');
      }

      // Check visibility
      const canManage = await this.canManageTickets(userId, eventId);
      if (!canManage && ticket.visibility !== 'public') {
        throw new ForbiddenException('Access denied to this ticket');
      }

      return { ticket };
    } catch (error) {
      this.logger.error(`Error in getTicket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(userId: string, eventId: string, dto: CreateTicketDto) {
    try {
      const canManage = await this.canManageTickets(userId, eventId);
      if (!canManage) {
        throw new ForbiddenException('You do not have permission to manage tickets for this event');
      }

      // Validate group ticket requirements
      if (dto.type === 'group' && (!dto.group_size || dto.group_size < 2)) {
        throw new BadRequestException('Group tickets must have group_size >= 2');
      }

      if (dto.type === 'individual' && dto.group_size) {
        throw new BadRequestException('Individual tickets cannot have group_size');
      }

      // Validate min/max purchase
      if (dto.min_purchase && dto.max_purchase && dto.min_purchase > dto.max_purchase) {
        throw new BadRequestException('min_purchase cannot be greater than max_purchase');
      }

      const { data: ticket, error } = await this.supabaseService
        .getClient()
        .from('event_tickets')
        .insert({
          event_id: eventId,
          ...dto,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating ticket: ${error.message}`);
        throw new BadRequestException('Failed to create ticket');
      }

      return { ticket };
    } catch (error) {
      this.logger.error(`Error in createTicket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a ticket
   */
  async updateTicket(
    userId: string,
    eventId: string,
    ticketId: string,
    dto: UpdateTicketDto,
  ) {
    try {
      const canManage = await this.canManageTickets(userId, eventId);
      if (!canManage) {
        throw new ForbiddenException('You do not have permission to manage tickets for this event');
      }

      // Validate group ticket requirements if type is being changed
      if (dto.type === 'group' && dto.group_size && dto.group_size < 2) {
        throw new BadRequestException('Group tickets must have group_size >= 2');
      }

      const { data: ticket, error } = await this.supabaseService
        .getClient()
        .from('event_tickets')
        .update(dto)
        .eq('id', ticketId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating ticket: ${error.message}`);
        throw new BadRequestException('Failed to update ticket');
      }

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      return { ticket };
    } catch (error) {
      this.logger.error(`Error in updateTicket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(userId: string, eventId: string, ticketId: string) {
    try {
      const canManage = await this.canManageTickets(userId, eventId);
      if (!canManage) {
        throw new ForbiddenException('You do not have permission to manage tickets for this event');
      }

      // Check if ticket has any registrations
      const { data: registrations } = await this.supabaseService
        .getClient()
        .from('event_registrations')
        .select('id')
        .eq('ticket_id', ticketId)
        .limit(1);

      if (registrations && registrations.length > 0) {
        throw new BadRequestException('Cannot delete ticket with existing registrations');
      }

      const { error } = await this.supabaseService
        .getClient()
        .from('event_tickets')
        .delete()
        .eq('id', ticketId)
        .eq('event_id', eventId);

      if (error) {
        this.logger.error(`Error deleting ticket: ${error.message}`);
        throw new BadRequestException('Failed to delete ticket');
      }

      return { message: 'Ticket deleted successfully' };
    } catch (error) {
      this.logger.error(`Error in deleteTicket: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // CUSTOM FIELDS CRUD
  // ==========================================

  /**
   * Get all custom fields for an event
   */
  async getCustomFields(userId: string, eventId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('ticket_custom_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (error) {
        this.logger.error(`Error fetching custom fields: ${error.message}`);
        throw new BadRequestException('Failed to fetch custom fields');
      }

      return { fields: data || [] };
    } catch (error) {
      this.logger.error(`Error in getCustomFields: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a custom field
   */
  async createCustomField(userId: string, eventId: string, dto: CreateCustomFieldDto) {
    try {
      const canManage = await this.canManageTickets(userId, eventId);
      if (!canManage) {
        throw new ForbiddenException('You do not have permission to manage tickets for this event');
      }

      const { data: field, error } = await this.supabaseService
        .getClient()
        .from('ticket_custom_fields')
        .insert({
          event_id: eventId,
          ...dto,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating custom field: ${error.message}`);
        throw new BadRequestException('Failed to create custom field');
      }

      return { field };
    } catch (error) {
      this.logger.error(`Error in createCustomField: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a custom field
   */
  async updateCustomField(
    userId: string,
    eventId: string,
    fieldId: string,
    dto: UpdateCustomFieldDto,
  ) {
    try {
      const canManage = await this.canManageTickets(userId, eventId);
      if (!canManage) {
        throw new ForbiddenException('You do not have permission to manage tickets for this event');
      }

      const { data: field, error } = await this.supabaseService
        .getClient()
        .from('ticket_custom_fields')
        .update(dto)
        .eq('id', fieldId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating custom field: ${error.message}`);
        throw new BadRequestException('Failed to update custom field');
      }

      if (!field) {
        throw new NotFoundException('Custom field not found');
      }

      return { field };
    } catch (error) {
      this.logger.error(`Error in updateCustomField: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a custom field
   */
  async deleteCustomField(userId: string, eventId: string, fieldId: string) {
    try {
      const canManage = await this.canManageTickets(userId, eventId);
      if (!canManage) {
        throw new ForbiddenException('You do not have permission to manage tickets for this event');
      }

      const { error } = await this.supabaseService
        .getClient()
        .from('ticket_custom_fields')
        .delete()
        .eq('id', fieldId)
        .eq('event_id', eventId);

      if (error) {
        this.logger.error(`Error deleting custom field: ${error.message}`);
        throw new BadRequestException('Failed to delete custom field');
      }

      return { message: 'Custom field deleted successfully' };
    } catch (error) {
      this.logger.error(`Error in deleteCustomField: ${error.message}`);
      throw error;
    }
  }
}
