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
      // Validate WhatsApp credentials
      if (!this.whatsappPhoneNumberId || !this.whatsappAccessToken) {
        this.logger.error('WhatsApp credentials not configured');
        throw new BadRequestException(
          'WhatsApp API credentials are not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN',
        );
      }

      // Send message via WhatsApp Cloud API
      const url = `https://graph.facebook.com/v18.0/${this.whatsappPhoneNumberId}/messages`;

      this.logger.log(`Sending WhatsApp message to ${to}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        this.logger.error('WhatsApp API Error:', JSON.stringify(responseData));
        throw new BadRequestException(
          responseData.error?.message || 'Failed to send WhatsApp message',
        );
      }

      const wamid = responseData.messages?.[0]?.id;
      
      if (!wamid) {
        this.logger.error('No message ID returned from WhatsApp API');
        throw new BadRequestException('Invalid response from WhatsApp API');
      }

      this.logger.log(`WhatsApp message sent successfully. WAMID: ${wamid}`);

      // Store message in database
      const { data, error } = await this.supabaseService.getClient()
        .from('whatsapp_messages')
        .insert({
          from_phone: this.whatsappPhoneNumberId,
          to_phone: to,
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
        this.logger.error('Failed to store message in database', error);
        // Message was sent but not stored - log warning but don't fail
        this.logger.warn(`Message sent to WhatsApp but failed to store in DB. WAMID: ${wamid}`);
      }

      return {
        wamid,
        status: 'sent',
        message_id: data?.id,
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
      let query = this.supabaseService.getClient()
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (phone) {
        query = query.or(`from_phone.eq.${phone},to_phone.eq.${phone}`);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Failed to fetch messages', error);
        throw new BadRequestException('Failed to fetch messages');
      }

      return data.map((msg) => ({
        id: msg.id,
        from: msg.from_phone,
        to: msg.to_phone,
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
      const { data, error } = await this.supabaseService.getClient()
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
      this.logger.log('Processing webhook payload', JSON.stringify(payload));

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
        const metadata = payload.entry[0].changes[0].value.metadata;
        
        this.logger.log(`Processing ${messages.length} incoming messages`);

        for (const msg of messages) {
          await this.storeIncomingMessage(msg, metadata);
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
      const { error } = await this.supabaseService.getClient()
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

  private async storeIncomingMessage(message: any, metadata?: any) {
    try {
      // Extract message content based on type
      let messageText = '';
      
      if (message.type === 'text') {
        messageText = message.text?.body || '';
      } else if (message.type === 'image') {
        messageText = `[Image] ${message.image?.caption || ''}`;
      } else if (message.type === 'video') {
        messageText = `[Video] ${message.video?.caption || ''}`;
      } else if (message.type === 'audio') {
        messageText = '[Audio message]';
      } else if (message.type === 'document') {
        messageText = `[Document] ${message.document?.filename || ''}`;
      } else {
        messageText = `[${message.type}]`;
      }

      const { error } = await this.supabaseService.getClient()
        .from('whatsapp_messages')
        .insert({
          from_phone: message.from,
          to_phone: metadata?.phone_number_id || this.whatsappPhoneNumberId,
          message: messageText,
          status: 'received',
          direction: 'inbound',
          wamid: message.id,
        });

      if (error) {
        this.logger.error('Failed to store incoming message', error);
      } else {
        this.logger.log(`Stored incoming message from ${message.from}: ${messageText}`);
      }
    } catch (error) {
      this.logger.error('Error storing incoming message', error);
    }
  }

  async getMetaTemplates() {
    try {
      if (!this.whatsappAccessToken) {
        throw new BadRequestException('WhatsApp access token not configured');
      }

      // Get WhatsApp Business Account ID from config
      const wabaid = this.configService.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID', '');
      
      if (!wabaid) {
        throw new BadRequestException('WhatsApp Business Account ID not configured');
      }

      const url = `https://graph.facebook.com/v18.0/${wabaid}/message_templates`;

      this.logger.log('Fetching templates from Meta');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.whatsappAccessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error('Meta API Error:', JSON.stringify(data));
        throw new BadRequestException(
          data.error?.message || 'Failed to fetch templates from Meta',
        );
      }

      this.logger.log(`Fetched ${data.data?.length || 0} templates from Meta`);

      return data.data || [];
    } catch (error) {
      this.logger.error('Error fetching Meta templates', error);
      throw new BadRequestException(
        error.message || 'Failed to fetch templates',
      );
    }
  }

  async syncMetaTemplates() {
    try {
      const metaTemplates = await this.getMetaTemplates();
      
      this.logger.log(`Syncing ${metaTemplates.length} templates to database`);

      const syncedTemplates: any[] = [];

      for (const template of metaTemplates) {
        // Only sync approved templates
        if (template.status !== 'APPROVED') {
          continue;
        }

        // Extract template content and variables
        const bodyComponent = template.components?.find((c: any) => c.type === 'BODY');
        const content = bodyComponent?.text || '';
        
        // Extract variables from {{1}}, {{2}} format
        const variables: string[] = [];
        const variableMatches = content.match(/\{\{(\d+)\}\}/g);
        if (variableMatches) {
          variableMatches.forEach((match: string, index: number) => {
            variables.push(`var${index + 1}`);
          });
        }

        // Check if template already exists
        const { data: existing } = await this.supabaseService.getClient()
          .from('whatsapp_templates')
          .select('id')
          .eq('name', template.name)
          .single();

        if (existing) {
          // Update existing template
          const { error } = await this.supabaseService.getClient()
            .from('whatsapp_templates')
            .update({
              content,
              category: template.category || 'general',
              variables,
              is_active: true,
              meta_template_id: template.id,
              meta_template_name: template.name,
              meta_language: template.language,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!error) {
            syncedTemplates.push({ ...template, action: 'updated' });
          }
        } else {
          // Insert new template
          const { error } = await this.supabaseService.getClient()
            .from('whatsapp_templates')
            .insert({
              name: template.name,
              content,
              category: template.category || 'general',
              variables,
              is_active: true,
              meta_template_id: template.id,
              meta_template_name: template.name,
              meta_language: template.language,
            });

          if (!error) {
            syncedTemplates.push({ ...template, action: 'created' });
          }
        }
      }

      this.logger.log(`Successfully synced ${syncedTemplates.length} templates`);

      return {
        success: true,
        synced: syncedTemplates.length,
        templates: syncedTemplates,
      };
    } catch (error) {
      this.logger.error('Error syncing templates', error);
      throw new BadRequestException(
        error.message || 'Failed to sync templates',
      );
    }
  }
}
