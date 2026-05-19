import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('messages')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>(
      'WHATSAPP_WEBHOOK_SECRET',
      '',
    );
  }

  @Post('send')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.whatsappService.sendMessage(sendMessageDto, user.sub);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  async getMessages(
    @Query('limit') limit?: string,
    @Query('phone') phone?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.whatsappService.getMessages(limitNum, phone);
  }

  @Get('stats')
  @UseGuards(SupabaseAuthGuard)
  async getStats() {
    return this.whatsappService.getStats();
  }

  @Get('templates')
  @UseGuards(SupabaseAuthGuard)
  async getTemplates(
    @Query('source') source?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('type') templateType?: string,
  ) {
    // If source is 'meta', fetch from Meta API, otherwise fetch from local DB
    if (source === 'meta') {
      return this.whatsappService.getMetaTemplates();
    }
    return this.whatsappService.getLocalTemplates(category, language, templateType);
  }

  @Get('templates/:id')
  @UseGuards(SupabaseAuthGuard)
  async getTemplateById(@Param('id') id: string) {
    return this.whatsappService.getTemplateById(id);
  }

  @Post('templates')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(
    @Body() createTemplateDto: CreateTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.whatsappService.createTemplate(createTemplateDto);
  }

  @Post('templates/sync')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncTemplates(@CurrentUser() user: RequestUser) {
    return this.whatsappService.syncMetaTemplates();
  }

  @Delete('templates/:name')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteTemplate(
    @Param('name') name: string,
    @Query('language') language?: string,
  ) {
    return this.whatsappService.deleteTemplate(name, language);
  }

  @Post('send-template')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendTemplateMessage(
    @Body() sendTemplateDto: SendTemplateMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.whatsappService.sendTemplateMessage(sendTemplateDto, user.sub);
  }

  // Webhook verification endpoint (GET)
  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  async verifyWebhook(@Query() query: any) {
    const mode = query['hub.mode'] || (query.hub && query.hub.mode);
    const verifyToken = query['hub.verify_token'] || (query.hub && query.hub.verify_token);
    const challenge = query['hub.challenge'] || (query.hub && query.hub.challenge);

    this.logger.log('Webhook verification request received');
    this.logger.log(`Mode: ${mode}, Token: ${verifyToken}`);

    // Check if mode and token are correct
    if (mode === 'subscribe' && verifyToken === this.webhookSecret) {
      this.logger.log('Webhook verified successfully');
      // Return the challenge to verify the webhook
      return challenge;
    }

    this.logger.error('Webhook verification failed');
    throw new BadRequestException('Invalid verification token');
  }

  // Webhook endpoint for receiving messages and status updates (POST)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    this.logger.log('Webhook payload received');
    this.logger.log(JSON.stringify(payload, null, 2));

    try {
      await this.whatsappService.handleWebhook(payload);
      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      // Return 200 even on error to prevent Meta from retrying
      return { success: false, error: error.message };
    }
  }
}
