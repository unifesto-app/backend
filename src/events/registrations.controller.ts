import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto, VerifyPaymentDto } from './dto/create-registration.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('registrations')
@UseGuards(AuthGuard('jwt'))
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  /**
   * Create a new registration
   * POST /registrations
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRegistration(@Request() req, @Body() dto: CreateRegistrationDto) {
    return this.registrationsService.createRegistration(req.user.sub, dto);
  }

  /**
   * Verify payment after Razorpay checkout
   * POST /registrations/verify-payment
   */
  @Post('verify-payment')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Request() req, @Body() dto: VerifyPaymentDto) {
    return this.registrationsService.verifyPayment(req.user.sub, dto);
  }

  /**
   * Get Razorpay configuration
   * GET /registrations/razorpay-config
   */
  @Get('razorpay-config')
  getRazorpayConfig() {
    return this.registrationsService.getRazorpayConfig();
  }

  /**
   * Get user's registrations
   * GET /registrations/my
   */
  @Get('my')
  getUserRegistrations(@Request() req) {
    return this.registrationsService.getUserRegistrations(req.user.sub);
  }

  /**
   * Get user's registrations for a specific event
   * GET /registrations/my/event/:eventId
   */
  @Get('my/event/:eventId')
  getUserEventRegistrations(@Request() req, @Param('eventId') eventId: string) {
    return this.registrationsService.getUserRegistrations(req.user.sub, eventId);
  }

  /**
   * Get registration by ID
   * GET /registrations/:id
   */
  @Get(':id')
  getRegistration(@Request() req, @Param('id') id: string) {
    return this.registrationsService.getRegistration(req.user.sub, id);
  }

  /**
   * Cancel registration
   * DELETE /registrations/:id
   */
  @Delete(':id')
  cancelRegistration(@Request() req, @Param('id') id: string) {
    return this.registrationsService.cancelRegistration(req.user.sub, id);
  }

  /**
   * Get all registrations for an event (organizers only)
   * GET /registrations/event/:eventId
   */
  @Get('event/:eventId')
  getEventRegistrations(@Request() req, @Param('eventId') eventId: string) {
    return this.registrationsService.getEventRegistrations(req.user.sub, eventId);
  }
}
