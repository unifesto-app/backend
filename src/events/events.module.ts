import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { PublicEventsController } from './public-events.controller';
import { RegistrationsController } from './registrations.controller';
import { EventsService } from './events.service';
import { PublicEventsService } from './public-events.service';
import { EventAccessService } from './event-access.service';
import { EventAdditionalInfoService } from './event-additional-info.service';
import { TicketsService } from './tickets.service';
import { RazorpayService } from './razorpay.service';
import { RegistrationsService } from './registrations.service';
import { DatabaseModule } from '../common/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [DatabaseModule, PermissionsModule, AuthModule, RolesModule],
  controllers: [EventsController, PublicEventsController, RegistrationsController],
  providers: [
    EventsService,
    PublicEventsService,
    EventAccessService,
    EventAdditionalInfoService,
    TicketsService,
    RazorpayService,
    RegistrationsService,
  ],
  exports: [
    EventsService,
    PublicEventsService,
    EventAccessService,
    EventAdditionalInfoService,
    TicketsService,
    RazorpayService,
    RegistrationsService,
  ],
})
export class EventsModule {}
