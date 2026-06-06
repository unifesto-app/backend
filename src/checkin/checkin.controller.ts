import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckinService } from './checkin.service';
import { BulkCheckinDto, ScanQRCodeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Check-in')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('scan')
  @ApiOperation({ summary: 'Scan QR code to check in attendee' })
  @ApiResponse({ status: 200 })
  async scanQRCode(@Request() req, @Body() dto: ScanQRCodeDto) {
    return this.checkinService.scanQRCode(req.user.id, dto.qrCode);
  }

  @Get('event/:id')
  @ApiOperation({
    summary: 'Get all registrations for offline caching (organiser only)',
  })
  @ApiResponse({ status: 200 })
  async getEventRegistrationsForOffline(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.checkinService.getEventRegistrationsForOffline(
      req.user.id,
      id,
    );
  }

  @Get('event/:id/stats')
  @ApiOperation({ summary: 'Get live check-in stats (organiser only)' })
  @ApiResponse({ status: 200 })
  async getCheckinStats(@Request() req, @Param('id') id: string) {
    return this.checkinService.getCheckinStats(req.user.id, id);
  }

  @Post('event/:id/bulk')
  @ApiOperation({ summary: 'Bulk check-in by registration IDs' })
  @ApiResponse({ status: 201 })
  async bulkCheckin(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: BulkCheckinDto,
  ) {
    return this.checkinService.bulkCheckin(
      req.user.id,
      id,
      dto.registrationIds,
    );
  }
}
