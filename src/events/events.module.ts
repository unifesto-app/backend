import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { PublicEventsController } from './public-events.controller';
import { EventsService } from './events.service';
import { PublicEventsService } from './public-events.service';
import { DatabaseModule } from '../common/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, PermissionsModule, AuthModule],
  controllers: [EventsController, PublicEventsController],
  providers: [EventsService, PublicEventsService],
  exports: [EventsService, PublicEventsService],
})
export class EventsModule {}
