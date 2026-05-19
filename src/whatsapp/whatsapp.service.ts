import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMessageDto } from './dto/send-message.dto';
import { SupabaseService } from '../common/database/supabase.service';

interface Message {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'inbound' | 'outbound';
  wamid?: string;
  event_id?: string;
  user_id?: string;
  created_at?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly whatsappPhoneNumberId: string;
  private readonly whatsappAccessToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.whatsappPhoneNumberId = this.configService.get<string>(
      'WHATSAPP_PHONE_NUMBER_ID',
      '',
    );
    this.whatsappAccessToken = this.configService.get<string>(
      'WHATSAPP_ACCESS_TOKEN',
      '',
    );
  }

  async sendMessage(sendMessageDto: SendMessageDto, userId: string) {
    const { to, message, event_id } = sendMessageDto;

    try {
      // For now, simulate sending (you'll need to implement actual WhatsApp Cloud API)
      // TODO: Implement actual WhatsApp Cloud API call
      const wamid = `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store message in database
      const { data, error } = await this.supabaseService.client
        .from('whatsapp_messages')
        .insert({
          from: this.whatsappPhoneNumberId || 'system',
          to,
          message,
          status: 'sent',
          direction: 'outbound',
          wamid,
          event_id,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to store message', error);
        throw new BadRequestException('Failed to send message');
      }

      return {
        wamid,
        status: 'sent',
        message_id: data.id,
      };
    } catch (error) {
      this.logger.error('Error sending message', error);
      throw new BadRequestException(
        error.message || 'Failed to send message',
      );
    }
  }

  async getMessages(limit: number = 50, phone?: string) {
    try {
      let query = this.supabaseService.client
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (phone) {
        query = query.or(`from.eq.${phone},to.eq.${phone}`);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Failed to fetch messages', error);
        throw new BadRequestException('Failed to fetch messages');
      }

      return data.map((msg) => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        message: msg.message,
        timestamp: msg.created_at,
        status: msg.status,
        direction: msg.direction,
        wamid: msg.wamid,
        event_id: msg.event_id,
      }));
    } catch (error) {
      this.logger.error('Error fetching messages', error);
      throw new BadRequestException('Failed to fetch messages');
    }
  }

  async getStats() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('whatsapp_messages')
        .select('status')
        .eq('direction', 'outbound');

      if (error) {
        this.logger.error('Failed to fetch stats', error);
        throw new BadRequestException('Failed to fetch stats');
      }

      const stats = {
        total_sent: data.length,
        delivered: data.filter((m) => m.status === 'delivered').length,
        failed: data.filter((m) => m.status === 'failed').length,
        read: data.filter((m) => m.status === 'read').length,
      };

      return stats;
    } catch (error) {
      this.logger.error('Error fetching stats', error);
      throw new BadRequestException('Failed to fetch stats');
    }
  }

  // Webhook handler for WhatsApp status updates
  async handleWebhook(payload: any) {
    try {
      this.logger.log('Processing webhook payload');

      // Process status updates
      if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
        const statuses = payload.entry[0].changes[0].value.statuses;
        this.logger.log(`Processing ${statuses.length} status updates`);

        for (const status of statuses) {
          await this.updateMessageStatus(status.id, status.status);
        }
      }

      // Process incoming messages
      if (payload.entry?.[0]?.changes?.[0]?.value?.messages) {
        const messages = payload.entry[0].changes[0].value.messages;
        this.logger.log(`Processing ${messages.length} incoming messages`);

        for (const msg of messages) {
          await this.storeIncomingMessage(msg);
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      return { success: false, error: error.message };
    }
  }

  private async updateMessageStatus(wamid: string, status: string) {
    try {
      const { error } = await this.supabaseService.client
        .from('whatsapp_messages')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('wamid', wamid);

      if (error) {
        this.logger.error(`Failed to update message status for ${wamid}`, error);
      } else {
        this.logger.log(`Updated message ${wamid} status to ${status}`);
      }
    } catch (error) {
      this.logger.error('Error updating message status', error);
    }
  }

  private async storeIncomingMessage(message: any) {
    try {
      const { error } = await this.supabaseService.client
        .from('whatsapp_messages')
        .insert({
          from_phone: message.from,
          to_phone: this.whatsappPhoneNumberId,
          message: message.text?.body || message.type || '',
          status: 'received',
          direction: 'inbound',
          wamid: message.id,
        });

      if (error) {
        this.logger.error('Failed to store incoming message', error);
      } else {
        this.logger.log(`Stored incoming message from ${message.from}`);
      }
    } catch (error) {
      this.logger.error('Error storing incoming message', error);
    }
  }
}
