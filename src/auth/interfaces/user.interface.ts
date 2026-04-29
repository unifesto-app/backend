export interface JwtPayload {
  sub: string; // user id
  email?: string;
  aud?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export interface RequestUser {
  sub: string;
  email?: string;
  role?: string;
}

export enum UserRole {
  ATTENDEE = 'attendee',
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
}

export interface UserPreferences {
  push_notifications?: boolean;
  email_notifications?: boolean;
  event_reminders?: boolean;
  marketing_emails?: boolean;
  [key: string]: any; // Allow additional custom preferences
}

export interface Profile {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  is_banned: boolean;
  preferences?: UserPreferences;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'ios' | 'android' | 'web' | 'desktop' | 'unknown';
  device_model?: string;
  os_version?: string;
  app_version?: string;
  device_token?: string;
  device_fingerprint: string;
  ip_address?: string;
  user_agent?: string;
  last_active: Date;
  first_seen: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
