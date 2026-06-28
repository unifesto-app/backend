import { User } from '@prisma/client';
export declare class AuthResponseDto {
    accessToken: string;
    user: UserProfileDto;
    requiresMobileVerification: boolean;
    tempToken?: string;
}
export declare class UserProfileDto {
    id: string;
    mobileNumber: string;
    mobileVerified: boolean;
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    gender: string | null;
    linkedinUrl: string | null;
    instagramUrl: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
    isOnboarded: boolean;
    createdAt: string;
    roles?: {
        role: {
            code: string;
            name: string;
        };
    }[];
    static fromUser(user: User, roles?: any[]): UserProfileDto;
}
