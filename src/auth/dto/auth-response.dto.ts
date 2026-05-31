import { User } from '@prisma/client';

export class AuthResponseDto {
  accessToken: string;
  user: UserProfileDto;
  requiresMobileVerification: boolean;
  tempToken?: string; // Only present when mobile verification is required
}

export class UserProfileDto {
  id: string;
  mobileNumber: string;
  mobileVerified: boolean;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  isOnboarded: boolean;
  createdAt: string;

  static fromUser(user: User): UserProfileDto {
    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      mobileVerified: user.mobileVerified,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      linkedinUrl: user.linkedinUrl,
      instagramUrl: user.instagramUrl,
      githubUrl: user.githubUrl,
      websiteUrl: user.websiteUrl,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
