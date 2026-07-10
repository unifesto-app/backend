import { ConfigService } from '@nestjs/config';
export interface CognitoTokenPayload {
    sub: string;
    email?: string;
    email_verified?: boolean;
    iat: number;
    exp: number;
    token_use?: string;
    iss?: string;
    aud?: string;
}
export declare class CognitoJwtService {
    private configService;
    private readonly logger;
    private readonly jwksClient;
    private readonly region;
    private readonly userPoolId;
    private readonly clientId;
    private readonly issuer;
    constructor(configService: ConfigService);
    private getSigningKey;
    verifyCognitoToken(token: string): Promise<CognitoTokenPayload>;
    extractUserId(token: string): Promise<string>;
}
