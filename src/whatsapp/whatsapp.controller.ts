import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ConfigService } from '@nestjs/config';

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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @GetUser() user: any,
  ) {
    return this.whatsappService.sendMessage(sendMessageDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Query('limit') limit?: string,
    @Query('phone') phone?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.whatsappService.getMessages(limitNum, phone);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.whatsappService.getStats();
  }

  // Webhook verification endpoint (GET)
  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
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
