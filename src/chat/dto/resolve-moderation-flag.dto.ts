import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ModerationActionType } from '@prisma/client';

export class ResolveModerationFlagDto {
  @IsEnum(ModerationActionType)
  actionType: ModerationActionType;

  @IsOptional()
  @IsString()
  notes?: string;
}
