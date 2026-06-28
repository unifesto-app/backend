import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';

export enum SubSpaceRequestType {
  JOIN_SUPER = 'JOIN_SUPER',
  CONVERT_AND_JOIN = 'CONVERT_AND_JOIN',
  CONVERT_TO_SUPER = 'CONVERT_TO_SUPER',
}

export class CreateSubSpaceRequestDto {
  @IsEnum(SubSpaceRequestType)
  requestType: SubSpaceRequestType;

  @IsOptional()
  @IsUUID()
  subSpaceId?: string; // required for JOIN_SUPER and CONVERT_AND_JOIN

  @IsUUID()
  targetSpaceId: string; // required for all types

  @IsString()
  @MaxLength(1000)
  reason: string;
}

export class ReviewSubSpaceRequestDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
