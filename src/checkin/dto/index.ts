import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsUUID } from 'class-validator';

export class ScanQRCodeDto {
  @ApiProperty({ example: 'qr-code-hash' })
  @IsString()
  qrCode: string;
}

export class BulkCheckinDto {
  @ApiProperty({ example: ['reg-uuid-1', 'reg-uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  registrationIds: string[];
}
