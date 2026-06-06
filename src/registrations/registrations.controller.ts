import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { RegisterForEventDto, VerifyRegistrationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Registrations')
@Controller()
export class RegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  @Post('events/:id/register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register for an event (RSVP or buy tickets)' })
  @ApiResponse({ status: 201 })
  async registerForEvent(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RegisterForEventDto,
  ) {
    return this.registrationsService.registerForEvent(req.user.id, id, dto);
  }

  @Post('events/:id/register/create-order')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Razorpay order for registration' })
  @ApiResponse({ status: 201 })
  async createRazorpayOrder(
    @Request() req,
    @Param('id') registrationId: string,
  ) {
    return this.registrationsService.createRazorpayOrder(
      req.user.id,
      registrationId,
    );
  }

  @Post('events/:id/register/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Razorpay payment for registration' })
  @ApiResponse({ status: 200 })
  async verifyPayment(
    @Request() req,
    @Param('id') registrationId: string,
    @Body() dto: VerifyRegistrationDto,
  ) {
    return this.registrationsService.verifyPayment(
      req.user.id,
      registrationId,
      dto,
    );
  }

  @Get('events/:id/my-registration')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my registration for an event' })
  @ApiResponse({ status: 200 })
  async getMyRegistration(@Request() req, @Param('id') id: string) {
    return this.registrationsService.getMyRegistration(req.user.id, id);
  }

  @Delete('events/:id/register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel my registration' })
  @ApiResponse({ status: 200 })
  async cancelRegistration(@Request() req, @Param('id') id: string) {
    return this.registrationsService.cancelRegistration(req.user.id, id);
  }

  @Get('events/:id/registrations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get event registrations (organiser only)' })
  @ApiResponse({ status: 200 })
  async getEventRegistrations(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.registrationsService.getEventRegistrations(
      req.user.id,
      id,
      +page,
      +limit,
    );
  }

  @Get('events/:id/registrations/export')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Export registrations as CSV (Growth plan+)' })
  @ApiResponse({ status: 200 })
  async exportRegistrations(@Request() req, @Param('id') id: string) {
    return this.registrationsService.exportRegistrations(req.user.id, id);
  }

  @Get('users/me/registrations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my event registration history' })
  @ApiResponse({ status: 200 })
  async getMyRegistrations(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.registrationsService.getMyRegistrations(
      req.user.id,
      +page,
      +limit,
    );
  }

  @Post('registrations/razorpay-webhook')
  @ApiOperation({ summary: 'Handle Razorpay webhooks' })
  @ApiResponse({ status: 200 })
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: any,
  ) {
    return this.registrationsService.handleRazorpayWebhook(
      req.body,
      signature,
    );
  }
}
