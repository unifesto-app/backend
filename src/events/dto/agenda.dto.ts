import { IsString, IsOptional, IsUUID, IsDateString, IsArray, IsInt } from 'class-validator';

export class CreateAgendaItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  start_time: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  speaker_ids?: string[];

  @IsOptional()
  @IsInt()
  display_order?: number;
}

export class UpdateAgendaItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  speaker_ids?: string[];

  @IsOptional()
  @IsInt()
  display_order?: number;
}
