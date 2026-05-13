import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreatePrizeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  @IsIn(['cash', 'trophy', 'certificate', 'product', 'other'])
  prize_type?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsInt()
  display_order?: number;
}

export class UpdatePrizeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  @IsIn(['cash', 'trophy', 'certificate', 'product', 'other'])
  prize_type?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsInt()
  display_order?: number;
}
