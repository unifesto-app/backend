import { AuthService } from './auth.service';
import { GoogleLoginDto, AppleLoginDto, EmailLoginDto, SendMobileOtpDto, VerifyMobileDto, AuthResponseDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginWithGoogle(dto: GoogleLoginDto): Promise<AuthResponseDto>;
    loginWithApple(dto: AppleLoginDto): Promise<AuthResponseDto>;
    loginWithCognito(body: {
        idToken: string;
    }): Promise<AuthResponseDto>;
    loginWithEmail(dto: EmailLoginDto): Promise<{
        message: string;
    }>;
    verifyEmailOtp(body: {
        email: string;
        otp: string;
    }): Promise<AuthResponseDto>;
    sendMobileOtp(dto: SendMobileOtpDto): Promise<{
        message: string;
    }>;
    verifyMobile(dto: VerifyMobileDto): Promise<AuthResponseDto>;
    getSession(req: any): Promise<{
        user: any;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
}
