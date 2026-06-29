"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileDto = exports.AuthResponseDto = void 0;
class AuthResponseDto {
    accessToken;
    user;
    requiresMobileVerification;
    isNewUser;
    tempToken;
}
exports.AuthResponseDto = AuthResponseDto;
class UserProfileDto {
    id;
    mobileNumber;
    mobileVerified;
    username;
    fullName;
    avatarUrl;
    bio;
    gender;
    linkedinUrl;
    instagramUrl;
    githubUrl;
    websiteUrl;
    isOnboarded;
    createdAt;
    roles;
    hasAppliedReferral;
    static fromUser(user, roles) {
        return {
            id: user.id,
            mobileNumber: user.mobileNumber,
            mobileVerified: user.mobileVerified,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            gender: user.gender ?? null,
            linkedinUrl: user.linkedinUrl,
            instagramUrl: user.instagramUrl,
            githubUrl: user.githubUrl,
            websiteUrl: user.websiteUrl,
            isOnboarded: user.isOnboarded,
            createdAt: user.createdAt.toISOString(),
            roles: roles || [],
            hasAppliedReferral: user.referredBy != null,
        };
    }
}
exports.UserProfileDto = UserProfileDto;
//# sourceMappingURL=auth-response.dto.js.map