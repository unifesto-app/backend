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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
const jwt = __importStar(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const client_1 = require("@prisma/client");
const email_service_1 = require("../email/email.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const otp_service_1 = require("./otp.service");
const cognito_jwt_service_1 = require("./cognito-jwt.service");
const dto_1 = require("./dto");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    configService;
    emailService;
    whatsappService;
    otpService;
    cache;
    cognitoJwtService;
    logger = new common_1.Logger(AuthService_1.name);
    googleClient;
    appleJwksClient;
    jwtSecret;
    jwtExpiresIn;
    constructor(prisma, configService, emailService, whatsappService, otpService, cache, cognitoJwtService) {
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
        this.whatsappService = whatsappService;
        this.otpService = otpService;
        this.cache = cache;
        this.cognitoJwtService = cognitoJwtService;
        this.jwtSecret = this.configService.get('JWT_SECRET');
        this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '7d');
        const googleClientId = this.configService.get('GOOGLE_CLIENT_ID');
        this.googleClient = new google_auth_library_1.OAuth2Client(googleClientId);
        this.appleJwksClient = (0, jwks_rsa_1.default)({
            jwksUri: 'https://appleid.apple.com/auth/keys',
            cache: true,
            cacheMaxAge: 86400000,
        });
        this.logger.log('AuthService initialized - all existing auth flows preserved');
    }
    async loginWithGoogle(dto) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: dto.idToken,
                audience: this.configService.get('GOOGLE_CLIENT_ID'),
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new common_1.UnauthorizedException('Invalid Google token');
            }
            return await this.handleProviderLogin(client_1.Provider.GOOGLE, payload.sub, payload.email, payload.email_verified, payload.name);
        }
        catch (error) {
            this.logger.error('Google login failed', error);
            throw new common_1.UnauthorizedException('Google authentication failed');
        }
    }
    async loginWithApple(dto) {
        try {
            const decoded = await this.verifyAppleToken(dto.identityToken);
            return await this.handleProviderLogin(client_1.Provider.APPLE, decoded.sub, decoded.email, decoded.email_verified);
        }
        catch (error) {
            this.logger.error('Apple login failed', error);
            throw new common_1.UnauthorizedException('Apple authentication failed');
        }
    }
    async verifyAppleToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, (header, callback) => {
                this.appleJwksClient.getSigningKey(header.kid, (err, key) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        const signingKey = key?.getPublicKey();
                        callback(null, signingKey);
                    }
                });
            }, {
                audience: this.configService.get('APPLE_CLIENT_ID'),
                issuer: 'https://appleid.apple.com',
            }, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
        });
    }
    async loginWithEmail(dto) {
        try {
            const otp = this.otpService.generateOtp();
            await this.otpService.storeOtp(dto.email, otp);
            await this.emailService.sendOtpEmail(dto.email, otp);
            return {
                message: 'OTP sent to email. Use the OTP to complete authentication.',
            };
        }
        catch (error) {
            this.logger.error('Email OTP send failed', error);
            throw new common_1.BadRequestException('Failed to send email OTP');
        }
    }
    async verifyEmailOtp(email, otp) {
        try {
            this.logger.log(`Verifying email OTP for: ${email}`);
            this.logger.log(`OTP received: ${otp}`);
            const isBlocked = await this.cache.isOtpBlocked(email);
            if (isBlocked) {
                throw new common_1.UnauthorizedException('Too many failed attempts. Please try again in 15 minutes.');
            }
            const isValid = await this.otpService.verifyOtp(email, otp);
            this.logger.log(`OTP validation result: ${isValid}`);
            if (!isValid) {
                const failCount = await this.cache.trackFailedOtp(email);
                this.logger.warn(`Failed OTP attempt ${failCount} for ${email}`);
                throw new common_1.UnauthorizedException('Invalid or expired OTP');
            }
            await this.cache.clearFailedOtp(email);
            this.logger.log(`Handling provider login for email: ${email}`);
            return await this.handleProviderLogin(client_1.Provider.EMAIL, email, email, true);
        }
        catch (error) {
            this.logger.error('Email OTP verification failed', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
    }
    async sendMobileOtp(dto) {
        try {
            const decoded = this.verifyTempToken(dto.tempToken);
            const otp = this.otpService.generateOtp();
            await this.otpService.storeOtp(dto.mobileNumber, otp);
            await this.whatsappService.sendOtp(dto.mobileNumber, otp);
            return {
                message: 'OTP sent to your WhatsApp',
            };
        }
        catch (error) {
            this.logger.error('Mobile OTP send failed', error);
            throw new common_1.BadRequestException('Failed to send mobile OTP');
        }
    }
    async verifyMobile(dto) {
        try {
            const decoded = this.verifyTempToken(dto.tempToken);
            const isBlocked = await this.cache.isOtpBlocked(dto.mobileNumber);
            if (isBlocked) {
                throw new common_1.UnauthorizedException('Too many failed attempts. Please try again in 15 minutes.');
            }
            const isValid = await this.otpService.verifyOtp(dto.mobileNumber, dto.otp);
            if (!isValid) {
                const failCount = await this.cache.trackFailedOtp(dto.mobileNumber);
                this.logger.warn(`Failed mobile OTP attempt ${failCount} for ${dto.mobileNumber}`);
                throw new common_1.UnauthorizedException('Invalid or expired OTP');
            }
            await this.cache.clearFailedOtp(dto.mobileNumber);
            const cognitoUser = await this.prisma.userIdentity.findFirst({
                where: {
                    provider: decoded.provider,
                    providerUserId: decoded.providerUserId,
                },
                include: { user: true },
            });
            if (cognitoUser && !cognitoUser.user.mobileVerified) {
                const existingMobileUser = await this.prisma.user.findUnique({
                    where: { mobileNumber: dto.mobileNumber },
                });
                if (existingMobileUser) {
                    await this.prisma.userIdentity.updateMany({
                        where: {
                            provider: decoded.provider,
                            providerUserId: decoded.providerUserId,
                        },
                        data: { userId: existingMobileUser.id },
                    });
                    await this.prisma.user.delete({
                        where: { id: cognitoUser.user.id },
                    }).catch(() => { });
                    const accessToken = this.generateAccessToken(existingMobileUser.id);
                    const userRoles = await this.prisma.userRole.findMany({
                        where: { userId: existingMobileUser.id },
                        include: { role: { select: { code: true, name: true } } },
                    });
                    return {
                        accessToken,
                        user: dto_1.UserProfileDto.fromUser(existingMobileUser, userRoles),
                        requiresMobileVerification: false,
                    };
                }
                const updatedUser = await this.prisma.user.update({
                    where: { id: cognitoUser.user.id },
                    data: {
                        mobileNumber: dto.mobileNumber,
                        mobileVerified: true,
                    },
                });
                const accessToken = this.generateAccessToken(updatedUser.id);
                return {
                    accessToken,
                    user: dto_1.UserProfileDto.fromUser(updatedUser),
                    requiresMobileVerification: false,
                };
            }
            const existingUser = await this.prisma.user.findUnique({
                where: { mobileNumber: dto.mobileNumber },
            });
            if (existingUser) {
                await this.linkIdentityToUser(existingUser.id, decoded.provider, decoded.providerUserId, decoded.email);
                const accessToken = this.generateAccessToken(existingUser.id);
                return {
                    accessToken,
                    user: dto_1.UserProfileDto.fromUser(existingUser),
                    requiresMobileVerification: false,
                };
            }
            else {
                const newUser = await this.createUser(dto.mobileNumber, decoded.provider, decoded.providerUserId, decoded.email);
                const accessToken = this.generateAccessToken(newUser.id);
                if (newUser.username) {
                    await this.whatsappService.sendWelcomeMessage(dto.mobileNumber, newUser.username);
                }
                return {
                    accessToken,
                    user: dto_1.UserProfileDto.fromUser(newUser),
                    requiresMobileVerification: false,
                };
            }
        }
        catch (error) {
            this.logger.error('Mobile verification failed', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Mobile verification failed');
        }
    }
    async handleProviderLogin(provider, providerUserId, email, emailVerified, fullName) {
        const existingIdentity = await this.prisma.userIdentity.findUnique({
            where: {
                unique_provider_user: {
                    provider,
                    providerUserId,
                },
            },
            include: {
                user: true,
            },
        });
        if (existingIdentity) {
            const user = existingIdentity.user;
            if (!user.mobileVerified) {
                const tempToken = this.generateTempToken(provider, providerUserId, email);
                return {
                    accessToken: '',
                    user: dto_1.UserProfileDto.fromUser(user),
                    requiresMobileVerification: true,
                    tempToken,
                };
            }
            const userRoles = await this.prisma.userRole.findMany({
                where: { userId: user.id },
                include: { role: { select: { code: true, name: true } } },
            });
            const accessToken = this.generateAccessToken(user.id);
            return {
                accessToken,
                user: dto_1.UserProfileDto.fromUser(user, userRoles),
                requiresMobileVerification: false,
            };
        }
        if (email) {
            const existingByEmail = await this.prisma.userIdentity.findFirst({
                where: { email },
                include: {
                    user: true,
                },
            });
            if (existingByEmail) {
                const user = existingByEmail.user;
                await this.linkIdentityToUser(user.id, provider, providerUserId, email);
                if (!user.mobileVerified) {
                    const tempToken = this.generateTempToken(provider, providerUserId, email);
                    return {
                        accessToken: '',
                        user: dto_1.UserProfileDto.fromUser(user),
                        requiresMobileVerification: true,
                        tempToken,
                    };
                }
                const userRoles = await this.prisma.userRole.findMany({
                    where: { userId: user.id },
                    include: { role: { select: { code: true, name: true } } },
                });
                const accessToken = this.generateAccessToken(user.id);
                return {
                    accessToken,
                    user: dto_1.UserProfileDto.fromUser(user, userRoles),
                    requiresMobileVerification: false,
                };
            }
        }
        const tempToken = this.generateTempToken(provider, providerUserId, email);
        return {
            accessToken: '',
            user: null,
            requiresMobileVerification: true,
            tempToken,
        };
    }
    async createUser(mobileNumber, provider, providerUserId, email) {
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    mobileNumber,
                    mobileVerified: true,
                    identities: {
                        create: {
                            provider,
                            providerUserId,
                            email,
                            emailVerified: !!email,
                        },
                    },
                },
            });
            await tx.wallet.create({
                data: {
                    userId: newUser.id,
                    balance: 0,
                },
            });
            await tx.orgSubscription.create({
                data: {
                    userId: newUser.id,
                    plan: 'STARTER',
                    billingCycle: 'MONTHLY',
                    isActive: true,
                    usageResetAt: this.getNextMonthStart(),
                },
            });
            const referralCode = this.generateReferralCode();
            await tx.user.update({
                where: { id: newUser.id },
                data: { referralCode },
            });
            return newUser;
        });
        this.logger.log(`Created new user ${user.id} with wallet, subscription, and referral code`);
        if (email) {
            this.emailService.sendWelcomeEmail(email, user.fullName || user.username || 'there').catch(err => this.logger.error('Failed to send welcome email', err));
        }
        return user;
    }
    generateReferralCode() {
        const crypto = require('crypto');
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    getNextMonthStart() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    async linkIdentityToUser(userId, provider, providerUserId, email) {
        try {
            await this.prisma.userIdentity.create({
                data: {
                    userId,
                    provider,
                    providerUserId,
                    email,
                    emailVerified: !!email,
                },
            });
        }
        catch (error) {
            this.logger.warn('Identity already linked', error);
        }
    }
    generateAccessToken(userId) {
        return jwt.sign({ userId }, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
        });
    }
    generateTempToken(provider, providerUserId, email) {
        return jwt.sign({
            provider,
            providerUserId,
            email,
        }, this.jwtSecret, {
            expiresIn: '15m',
        });
    }
    verifyTempToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async validateAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            return user;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async logout(userId) {
        return { message: 'Logged out successfully' };
    }
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
    async loginWithCognito(idToken) {
        if (!this.cognitoJwtService) {
            throw new common_1.UnauthorizedException('Cognito authentication not configured');
        }
        const payload = await this.cognitoJwtService.verifyCognitoToken(idToken);
        const email = payload.email;
        const cognitoSub = payload.sub;
        const rawProvider = payload['identities']?.[0]?.providerName?.toLowerCase() || 'cognito';
        const providerEnum = rawProvider === 'signinwithapple' ? client_1.Provider.APPLE : client_1.Provider.GOOGLE;
        if (!email) {
            throw new common_1.UnauthorizedException('Email not provided by identity provider');
        }
        this.logger.log(`[Cognito] email=${email} provider=${providerEnum} sub=${cognitoSub}`);
        let user = null;
        const existingIdentity = await this.prisma.userIdentity.findFirst({
            where: { provider: providerEnum, providerUserId: cognitoSub },
            include: { user: { include: { roles: { include: { role: true } } } } },
        });
        if (existingIdentity) {
            user = existingIdentity.user;
        }
        if (!user) {
            const identityByEmail = await this.prisma.userIdentity.findFirst({
                where: { email },
                include: { user: { include: { roles: { include: { role: true } } } } },
            });
            if (identityByEmail) {
                user = identityByEmail.user;
                await this.linkIdentityToUser(user.id, providerEnum, cognitoSub, email);
            }
        }
        if (!user) {
            const emailIdentity = await this.prisma.userIdentity.findFirst({
                where: { provider: client_1.Provider.EMAIL, providerUserId: email },
                include: { user: { include: { roles: { include: { role: true } } } } },
            });
            if (emailIdentity) {
                user = emailIdentity.user;
                await this.linkIdentityToUser(user.id, providerEnum, cognitoSub, email);
            }
        }
        if (user && user.mobileVerified) {
            const accessToken = this.generateAccessToken(user.id);
            return {
                accessToken,
                user: dto_1.UserProfileDto.fromUser(user, user.roles),
                requiresMobileVerification: false,
            };
        }
        if (user && !user.mobileVerified) {
            const tempToken = this.generateTempToken(providerEnum, cognitoSub, email);
            return {
                accessToken: '',
                user: dto_1.UserProfileDto.fromUser(user, user.roles),
                requiresMobileVerification: true,
                tempToken,
            };
        }
        const placeholderMobile = `+0${Date.now().toString().slice(-9)}`;
        const newUser = await this.prisma.user.create({
            data: {
                mobileNumber: placeholderMobile,
                mobileVerified: false,
                isOnboarded: false,
                identities: {
                    create: {
                        provider: providerEnum,
                        providerUserId: cognitoSub,
                        email,
                        emailVerified: true,
                    },
                },
            },
            include: { roles: { include: { role: true } } },
        });
        await this.prisma.wallet.create({
            data: { userId: newUser.id, balance: 0 },
        }).catch(() => { });
        const tempToken = this.generateTempToken(providerEnum, cognitoSub, email);
        return {
            accessToken: '',
            user: dto_1.UserProfileDto.fromUser(newUser, []),
            requiresMobileVerification: true,
            tempToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        email_service_1.EmailService,
        whatsapp_service_1.WhatsAppService,
        otp_service_1.OtpService,
        cache_service_1.CacheService,
        cognito_jwt_service_1.CognitoJwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map