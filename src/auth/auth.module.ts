import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { CognitoJwtService } from './cognito-jwt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [ConfigModule, PrismaModule, EmailModule, WhatsAppModule],
  controllers: [AuthController],
  providers: [AuthService, OtpService, CognitoJwtService, JwtAuthGuard],
  exports: [AuthService, CognitoJwtService, JwtAuthGuard],
})
export class AuthModule {}
