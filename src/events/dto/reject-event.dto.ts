import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejectEventDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
