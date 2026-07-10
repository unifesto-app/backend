"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CognitoJwtService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoJwtService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt = __importStar(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
let CognitoJwtService = CognitoJwtService_1 = class CognitoJwtService {
    configService;
    logger = new common_1.Logger(CognitoJwtService_1.name);
    jwksClient;
    region;
    userPoolId;
    clientId;
    issuer;
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.get('AWS_REGION') || '';
        this.userPoolId = this.configService.get('COGNITO_USER_POOL_ID') || '';
        this.clientId = this.configService.get('COGNITO_CLIENT_ID') || '';
        if (!this.region || !this.userPoolId || !this.clientId) {
            this.logger.warn('Cognito configuration incomplete. CognitoJwtService will not function properly.');
        }
        this.issuer = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;
        const jwksUri = `${this.issuer}/.well-known/jwks.json`;
        this.jwksClient = (0, jwks_rsa_1.default)({
            jwksUri,
            cache: true,
            cacheMaxAge: 24 * 60 * 60 * 1000,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
        });
        this.logger.log(`CognitoJwtService initialized for region: ${this.region}, userPoolId: ${this.userPoolId}`);
    }
    async getSigningKey(kid) {
        try {
            const key = await this.jwksClient.getSigningKey(kid);
            return key.getPublicKey();
        }
        catch (error) {
            this.logger.error('Failed to fetch signing key from JWKS', {
                kid,
                error: error.message,
            });
            throw new common_1.UnauthorizedException('Unable to verify token signature');
        }
    }
    async verifyCognitoToken(token) {
        try {
            const decodedToken = jwt.decode(token, { complete: true });
            if (!decodedToken || typeof decodedToken === 'string') {
                this.logger.warn('Token verification failed: malformed token');
                throw new common_1.UnauthorizedException('Invalid token');
            }
            const { kid } = decodedToken.header;
            if (!kid) {
                this.logger.warn('Token verification failed: missing kid in header');
                throw new common_1.UnauthorizedException('Invalid token');
            }
            const signingKey = await this.getSigningKey(kid);
            const verified = jwt.verify(token, signingKey, {
                algorithms: ['RS256'],
                issuer: this.issuer,
                audience: this.clientId,
            });
            this.logger.debug('Token verified successfully', {
                userId: verified.sub,
            });
            return verified;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                this.logger.warn('Token verification failed: token expired');
                throw new common_1.UnauthorizedException('Token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                this.logger.warn('Token verification failed: invalid token', {
                    reason: error.message,
                });
                throw new common_1.UnauthorizedException('Invalid token');
            }
            if (error.name === 'NotBeforeError') {
                this.logger.warn('Token verification failed: token not yet valid');
                throw new common_1.UnauthorizedException('Invalid token');
            }
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('Unexpected error during token verification', {
                errorName: error.name,
                errorMessage: error.message,
            });
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    async extractUserId(token) {
        const payload = await this.verifyCognitoToken(token);
        return payload.sub;
    }
};
exports.CognitoJwtService = CognitoJwtService;
exports.CognitoJwtService = CognitoJwtService = CognitoJwtService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CognitoJwtService);
//# sourceMappingURL=cognito-jwt.service.js.map