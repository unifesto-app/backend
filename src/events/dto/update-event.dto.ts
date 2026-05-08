import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsEnum(['draft', 'pending', 'approved', 'rejected', 'published', 'cancelled'])
  @IsOptional()
  status?: string;
}
