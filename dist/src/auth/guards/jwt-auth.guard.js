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
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
const cognito_jwt_service_1 = require("../cognito-jwt.service");
const jwt = __importStar(require("jsonwebtoken"));
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    authService;
    cognitoJwtService;
    logger = new common_1.Logger(JwtAuthGuard_1.name);
    constructor(authService, cognitoJwtService) {
        this.authService = authService;
        this.cognitoJwtService = cognitoJwtService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new common_1.UnauthorizedException('No authorization header');
        }
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('Invalid authorization header format');
        }
        try {
            const tokenType = this.detectTokenType(token);
            if (tokenType === 'cognito') {
                this.logger.debug('Detected Cognito JWT, routing to CognitoJwtService');
                return await this.verifyCognitoToken(request, token);
            }
            else {
                this.logger.debug('Detected custom JWT, routing to AuthService');
                return await this.verifyCustomToken(request, token);
            }
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('Token verification failed', {
                errorName: error.name,
                errorMessage: error.message,
            });
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    detectTokenType(token) {
        try {
            const decoded = jwt.decode(token, { complete: true });
            if (!decoded || typeof decoded === 'string') {
                return 'custom';
            }
            const payload = decoded.payload;
            const hasCognitoIssuer = payload.iss &&
                typeof payload.iss === 'string' &&
                payload.iss.includes('cognito-idp');
            const hasTokenUse = payload.token_use !== undefined;
            if (hasCognitoIssuer && hasTokenUse) {
                return 'cognito';
            }
            return 'custom';
        }
        catch (error) {
            this.logger.debug('Token decode failed during type detection, defaulting to custom JWT');
            return 'custom';
        }
    }
    async verifyCognitoToken(request, token) {
        try {
            const cognitoPayload = await this.cognitoJwtService.verifyCognitoToken(token);
            const userId = cognitoPayload.sub;
            const user = await this.authService.getUserById(userId);
            request.user = user;
            return true;
        }
        catch (error) {
            this.logger.warn('Cognito JWT verification failed', {
                errorMessage: error.message,
            });
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid Cognito token');
        }
    }
    async verifyCustomToken(request, token) {
        try {
            const user = await this.authService.validateAccessToken(token);
            request.user = user;
            return true;
        }
        catch (error) {
            this.logger.warn('Custom JWT verification failed', {
                errorMessage: error.message,
            });
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        cognito_jwt_service_1.CognitoJwtService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map