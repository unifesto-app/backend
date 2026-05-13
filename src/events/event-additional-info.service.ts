import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { CreateAgendaItemDto, UpdateAgendaItemDto } from './dto/agenda.dto';
import { CreateSpeakerDto, UpdateSpeakerDto } from './dto/speaker.dto';
import { CreatePrizeDto, UpdatePrizeDto } from './dto/prize.dto';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@Injectable()
export class EventAdditionalInfoService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Check if user has permission to manage event
   */
  private async checkEventPermission(userId: string, eventId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Check if user is event creator
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.created_by === userId) {
      return; // User is creator
    }

    // Check if user is collaborator with edit permissions
    const { data: collaborator } = await supabase
      .from('event_collaborators')
      .select('can_edit_details, is_active')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('can_edit_details', true)
      .single();

    if (!collaborator) {
      throw new ForbiddenException('You do not have permission to manage this event');
    }
  }

  // ==========================================
  // AGENDA METHODS
  // ==========================================

  async getAgenda(eventId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_agenda')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createAgendaItem(userId: string, eventId: string, dto: CreateAgendaItemDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_agenda')
      .insert({
        event_id: eventId,
        ...dto,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAgendaItem(userId: string, eventId: string, itemId: string, dto: UpdateAgendaItemDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_agenda')
      .update({
        ...dto,
        updated_by: userId,
      })
      .eq('id', itemId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('Agenda item not found');
    return data;
  }

  async deleteAgendaItem(userId: string, eventId: string, itemId: string) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('event_agenda')
      .delete()
      .eq('id', itemId)
      .eq('event_id', eventId);

    if (error) throw error;
    return { message: 'Agenda item deleted successfully' };
  }

  // ==========================================
  // SPEAKERS METHODS
  // ==========================================

  async getSpeakers(eventId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_speakers')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createSpeaker(userId: string, eventId: string, dto: CreateSpeakerDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_speakers')
      .insert({
        event_id: eventId,
        ...dto,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSpeaker(userId: string, eventId: string, speakerId: string, dto: UpdateSpeakerDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_speakers')
      .update({
        ...dto,
        updated_by: userId,
      })
      .eq('id', speakerId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('Speaker not found');
    return data;
  }

  async deleteSpeaker(userId: string, eventId: string, speakerId: string) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('event_speakers')
      .delete()
      .eq('id', speakerId)
      .eq('event_id', eventId);

    if (error) throw error;
    return { message: 'Speaker deleted successfully' };
  }

  // ==========================================
  // PRIZES METHODS
  // ==========================================

  async getPrizes(eventId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_prizes')
      .select('*')
      .eq('event_id', eventId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createPrize(userId: string, eventId: string, dto: CreatePrizeDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_prizes')
      .insert({
        event_id: eventId,
        ...dto,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePrize(userId: string, eventId: string, prizeId: string, dto: UpdatePrizeDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_prizes')
      .update({
        ...dto,
        updated_by: userId,
      })
      .eq('id', prizeId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('Prize not found');
    return data;
  }

  async deletePrize(userId: string, eventId: string, prizeId: string) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('event_prizes')
      .delete()
      .eq('id', prizeId)
      .eq('event_id', eventId);

    if (error) throw error;
    return { message: 'Prize deleted successfully' };
  }

  // ==========================================
  // FAQ METHODS
  // ==========================================

  async getFaqs(eventId: string, includeUnpublished = false) {
    const supabase = this.supabaseService.getClient();
    
    let query = supabase
      .from('event_faq')
      .select('*')
      .eq('event_id', eventId);

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createFaq(userId: string, eventId: string, dto: CreateFaqDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_faq')
      .insert({
        event_id: eventId,
        ...dto,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFaq(userId: string, eventId: string, faqId: string, dto: UpdateFaqDto) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_faq')
      .update({
        ...dto,
        updated_by: userId,
      })
      .eq('id', faqId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('FAQ not found');
    return data;
  }

  async deleteFaq(userId: string, eventId: string, faqId: string) {
    await this.checkEventPermission(userId, eventId);
    
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('event_faq')
      .delete()
      .eq('id', faqId)
      .eq('event_id', eventId);

    if (error) throw error;
    return { message: 'FAQ deleted successfully' };
  }

  // ==========================================
  // GET ALL ADDITIONAL INFO
  // ==========================================

  async getAllAdditionalInfo(eventId: string, includeUnpublishedFaqs = false) {
    const [agenda, speakers, prizes, faqs] = await Promise.all([
      this.getAgenda(eventId),
      this.getSpeakers(eventId),
      this.getPrizes(eventId),
      this.getFaqs(eventId, includeUnpublishedFaqs),
    ]);

    return {
      agenda,
      speakers,
      prizes,
      faqs,
    };
  }
}
