import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { OtpService } from './otp.service';
import { CognitoJwtService } from './cognito-jwt.service';
import { GoogleLoginDto, AppleLoginDto, EmailLoginDto, SendMobileOtpDto, VerifyMobileDto, AuthResponseDto } from './dto';
export declare class AuthService {
    private readonly prisma;
    private readonly configService;
    private readonly emailService;
    private readonly whatsappService;
    private readonly otpService;
    private readonly cache;
    private readonly cognitoJwtService?;
    private readonly logger;
    private readonly googleClient;
    private readonly appleJwksClient;
    private readonly jwtSecret;
    private readonly jwtExpiresIn;
    constructor(prisma: PrismaService, configService: ConfigService, emailService: EmailService, whatsappService: WhatsAppService, otpService: OtpService, cache: CacheService, cognitoJwtService?: CognitoJwtService | undefined);
    loginWithGoogle(dto: GoogleLoginDto): Promise<AuthResponseDto>;
    loginWithApple(dto: AppleLoginDto): Promise<AuthResponseDto>;
    private verifyAppleToken;
    loginWithEmail(dto: EmailLoginDto): Promise<{
        message: string;
    }>;
    verifyEmailOtp(email: string, otp: string): Promise<AuthResponseDto>;
    sendMobileOtp(dto: SendMobileOtpDto): Promise<{
        message: string;
    }>;
    verifyMobile(dto: VerifyMobileDto): Promise<AuthResponseDto>;
    private handleProviderLogin;
    private createUser;
    private generateReferralCode;
    private getNextMonthStart;
    private linkIdentityToUser;
    private generateAccessToken;
    private generateTempToken;
    private verifyTempToken;
    validateAccessToken(token: string): Promise<User>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    getUserById(userId: string): Promise<User>;
    loginWithCognito(idToken: string): Promise<AuthResponseDto>;
}
