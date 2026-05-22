import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { RazorpayService } from './razorpay.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateRegistrationDto {
  eventId: string;
  ticketId: string;
  quantity: number;
  attendees: Array<{
    name: string;
    email: string;
    mobile: string;
    gender: string;
    customFields?: Record<string, any>;
  }>;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

interface VerifyPaymentDto {
  registrationIds: string[];
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly razorpayService: RazorpayService,
  ) {}

  /**
   * Generate QR code data for registration
   */
  private generateQRCode(registrationId: string, eventId: string): string {
    return `UNIFESTO:${eventId}:${registrationId}`;
  }

  /**
   * Create event registration(s) with payment
   */
  async createRegistration(userId: string, dto: CreateRegistrationDto) {
    try {
      // 1. Validate event exists and is published
      const { data: event, error: eventError } = await this.supabaseService
        .getClient()
        .from('events')
        .select('id, title, status')
        .eq('id', dto.eventId)
        .single();

      if (eventError || !event) {
        throw new NotFoundException('Event not found');
      }

      if (event.status !== 'published') {
        throw new BadRequestException('Event is not available for registration');
      }

      // 2. Validate ticket exists and is available
      const { data: ticket, error: ticketError } = await this.supabaseService
        .getClient()
        .from('event_tickets')
        .select('*')
        .eq('id', dto.ticketId)
        .eq('event_id', dto.eventId)
        .single();

      if (ticketError || !ticket) {
        throw new NotFoundException('Ticket not found');
      }

      if (ticket.visibility !== 'public') {
        throw new BadRequestException('Ticket is not available');
      }

      // 3. Check ticket availability
      const availableQuantity = ticket.quantity_available - (ticket.quantity_sold ?? 0);
      const requiredQuantity = ticket.type === 'group' ? 1 : dto.quantity;

      if (availableQuantity < requiredQuantity) {
        throw new BadRequestException('Not enough tickets available');
      }

      // 4. Validate quantity constraints
      if (dto.quantity < (ticket.min_purchase ?? 1) || dto.quantity > (ticket.max_purchase ?? 10)) {
        throw new BadRequestException(
          `Quantity must be between ${ticket.min_purchase ?? 1} and ${ticket.max_purchase ?? 10}`,
        );
      }

      // 5. Validate attendee count
      if (dto.attendees.length !== dto.quantity) {
        throw new BadRequestException('Attendee count must match quantity');
      }

      // 6. Calculate total amount
      let totalAmount = 0;
      if (ticket.price_type === 'per_person') {
        totalAmount = ticket.price * dto.quantity;
      } else if (ticket.price_type === 'per_group') {
        totalAmount = ticket.price;
      }

      // 7. Create group ID for group registrations
      const groupId = ticket.type === 'group' || dto.quantity > 1 ? uuidv4() : null;

      // 8. Create registrations for each attendee
      const registrations: any[] = [];
      const registrationIds: string[] = [];

      for (let i = 0; i < dto.attendees.length; i++) {
        const attendee = dto.attendees[i];
        const isGroupLeader = i === 0;

        const registrationData = {
          event_id: dto.eventId,
          ticket_id: dto.ticketId,
          user_id: userId,
          group_id: groupId,
          is_group_leader: groupId ? isGroupLeader : false,
          buyer_name: dto.buyerName,
          buyer_email: dto.buyerEmail,
          buyer_phone: dto.buyerPhone,
          total_amount: isGroupLeader ? totalAmount : 0, // Only charge group leader
          currency: ticket.currency,
          payment_status: totalAmount === 0 ? 'completed' : 'pending',
          status: 'confirmed',
          qr_code: '', // Will be updated after insert
        };

        const { data: registration, error: regError } = await this.supabaseService
          .getClient()
          .from('event_registrations')
          .insert(registrationData)
          .select()
          .single();

        if (regError) {
          this.logger.error(`Error creating registration: ${regError.message}`);
          throw new BadRequestException('Failed to create registration');
        }

        // Update QR code
        const qrCode = this.generateQRCode(registration.id, dto.eventId);
        await this.supabaseService
          .getClient()
          .from('event_registrations')
          .update({ qr_code: qrCode })
          .eq('id', registration.id);

        registration.qr_code = qrCode;

        // Save custom field answers
        if (attendee.customFields) {
          const answers = Object.entries(attendee.customFields).map(([fieldId, value]) => ({
            registration_id: registration.id,
            field_id: fieldId,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          }));

          if (answers.length > 0) {
            await this.supabaseService
              .getClient()
              .from('registration_field_answers')
              .insert(answers);
          }
        }

        registrations.push(registration);
        registrationIds.push(registration.id);
      }

      // 9. Create Razorpay order if payment is required
      let razorpayOrder: any = null;
      if (totalAmount > 0) {
        const receiptId = `reg_${groupId || registrationIds[0]}`;
        razorpayOrder = await this.razorpayService.createOrder(
          totalAmount,
          ticket.currency ?? 'INR',
          receiptId,
          {
            event_id: dto.eventId,
            ticket_id: dto.ticketId,
            group_id: groupId,
            registration_ids: registrationIds.join(','),
          },
        );
      }

      return {
        registrations,
        groupId,
        totalAmount,
        currency: ticket.currency,
        razorpayOrder,
        requiresPayment: totalAmount > 0,
      };
    } catch (error) {
      this.logger.error(`Error in createRegistration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify payment and update registration status
   */
  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    try {
      // 1. Verify payment signature
      const isValid = this.razorpayService.verifyPaymentSignature(
        dto.razorpayOrderId,
        dto.razorpayPaymentId,
        dto.razorpaySignature,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid payment signature');
      }

      // 2. Fetch payment details from Razorpay
      const paymentDetails = await this.razorpayService.getPaymentDetails(
        dto.razorpayPaymentId,
      );

      // 3. Update all registrations in the group
      const updates = dto.registrationIds.map((regId) =>
        this.supabaseService
          .getClient()
          .from('event_registrations')
          .update({
            payment_status: 'completed',
            payment_id: dto.razorpayPaymentId,
            payment_method: paymentDetails.method,
            paid_at: new Date().toISOString(),
          })
          .eq('id', regId)
          .eq('user_id', userId),
      );

      await Promise.all(updates);

      this.logger.log(
        `Payment verified and registrations updated: ${dto.registrationIds.join(', ')}`,
      );

      return {
        success: true,
        message: 'Payment verified successfully',
        paymentId: dto.razorpayPaymentId,
      };
    } catch (error) {
      this.logger.error(`Error in verifyPayment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's registrations
   */
  async getUserRegistrations(userId: string, eventId?: string) {
    try {
      let query = this.supabaseService
        .getClient()
        .from('event_registrations')
        .select(
          `
          *,
          event:events(id, title, slug, start_date, end_date, location, city, banner_url),
          ticket:event_tickets(id, name, type, price, currency)
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error(`Error fetching registrations: ${error.message}`);
        throw new BadRequestException('Failed to fetch registrations');
      }

      return { registrations: data || [] };
    } catch (error) {
      this.logger.error(`Error in getUserRegistrations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event registrations (for organizers)
   */
  async getEventRegistrations(userId: string, eventId: string) {
    try {
      // Check if user can view registrations
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('created_by')
        .eq('id', eventId)
        .single();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const isCreator = event.created_by === userId;

      // Check collaborator permissions
      const { data: collaborator } = await this.supabaseService
        .getClient()
        .from('event_collaborators')
        .select('permissions')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      const canView = isCreator || collaborator?.permissions?.includes('manage_attendees');

      if (!canView) {
        throw new ForbiddenException('You do not have permission to view registrations');
      }

      // Fetch registrations
      const { data, error } = await this.supabaseService
        .getClient()
        .from('event_registrations')
        .select(
          `
          *,
          ticket:event_tickets(id, name, type, price, currency)
        `,
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching event registrations: ${error.message}`);
        throw new BadRequestException('Failed to fetch registrations');
      }

      // Group by group_id for group registrations
      const grouped = (data || []).reduce((acc: any, reg: any) => {
        if (reg.group_id) {
          if (!acc[reg.group_id]) {
            acc[reg.group_id] = [];
          }
          acc[reg.group_id].push(reg);
        } else {
          acc[reg.id] = [reg];
        }
        return acc;
      }, {});

      return {
        registrations: data || [],
        grouped,
        totalRegistrations: data?.length || 0,
        totalRevenue: data?.reduce((sum: number, reg: any) => sum + Number(reg.total_amount), 0) || 0,
      };
    } catch (error) {
      this.logger.error(`Error in getEventRegistrations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get registration by ID
   */
  async getRegistration(userId: string, registrationId: string) {
    try {
      const { data: registration, error } = await this.supabaseService
        .getClient()
        .from('event_registrations')
        .select(
          `
          *,
          event:events(id, title, slug, start_date, end_date, location, city, banner_url),
          ticket:event_tickets(id, name, type, price, currency),
          answers:registration_field_answers(
            *,
            field:ticket_custom_fields(*)
          )
        `,
        )
        .eq('id', registrationId)
        .single();

      if (error || !registration) {
        throw new NotFoundException('Registration not found');
      }

      // Check access
      const isOwner = registration.user_id === userId;
      const { data: event } = await this.supabaseService
        .getClient()
        .from('events')
        .select('created_by')
        .eq('id', registration.event_id)
        .single();

      const isOrganizer = event?.created_by === userId;

      if (!isOwner && !isOrganizer) {
        throw new ForbiddenException('Access denied');
      }

      return { registration };
    } catch (error) {
      this.logger.error(`Error in getRegistration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel registration
   */
  async cancelRegistration(userId: string, registrationId: string) {
    try {
      const { data: registration, error } = await this.supabaseService
        .getClient()
        .from('event_registrations')
        .select('*')
        .eq('id', registrationId)
        .eq('user_id', userId)
        .single();

      if (error || !registration) {
        throw new NotFoundException('Registration not found');
      }

      if (registration.status === 'cancelled') {
        throw new BadRequestException('Registration already cancelled');
      }

      // Update status
      await this.supabaseService
        .getClient()
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('id', registrationId);

      // TODO: Initiate refund if applicable
      // if (registration.payment_status === 'completed' && registration.payment_id) {
      //   await this.razorpayService.createRefund(registration.payment_id);
      // }

      return { message: 'Registration cancelled successfully' };
    } catch (error) {
      this.logger.error(`Error in cancelRegistration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Razorpay configuration for client
   */
  getRazorpayConfig() {
    return {
      keyId: this.razorpayService.getKeyId(),
    };
  }
}
