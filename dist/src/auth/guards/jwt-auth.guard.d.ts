import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { CognitoJwtService } from '../cognito-jwt.service';
export declare class JwtAuthGuard implements CanActivate {
    private readonly authService;
    private readonly cognitoJwtService;
    private readonly logger;
    constructor(authService: AuthService, cognitoJwtService: CognitoJwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private detectTokenType;
    private verifyCognitoToken;
    private verifyCustomToken;
}
