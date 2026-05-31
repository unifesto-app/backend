# Unifesto Authentication & User System

## Overview

This is a mobile-number-centric identity system where:
- **One person = One account = One verified mobile number**
- Google, Apple, Email, and Phone are authentication methods, not accounts
- Every authentication method links to a single verified mobile number
- The verified mobile number is the canonical identity

## Core Principles

### Single Identity
A person should never have multiple Unifesto accounts. All authentication providers (Google, Apple, Email, Phone) are simply different ways to access the same account.

### Mobile Number as Canonical Identity
- Every user must have a verified mobile number
- Mobile number is unique across the platform
- All business logic references `user_id`, never email or provider ID

## Database Schema

### Users Table
Core user entity representing a person.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    mobile_number VARCHAR(20) UNIQUE NOT NULL,
    mobile_verified BOOLEAN NOT NULL DEFAULT false,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    github_url TEXT,
    website_url TEXT,
    is_onboarded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### User Identities Table
Authentication methods linked to users.

```sql
CREATE TABLE user_identities (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'apple', 'email', 'phone')),
    provider_user_id TEXT NOT NULL,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_user_id),
    UNIQUE(provider, email)
);
```

### Roles Table
Simple role definitions.

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('platform', 'space')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Default roles:
- **Platform Scope**: `ADMIN`
- **Space Scope**: `SUPER_ORGANISER`, `ORGANISER`, `CO_ORGANISER`, `MEMBER`

### User Roles Table
Role assignments to users.

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    space_id UUID,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id, space_id)
);
```

**Rules**:
- Platform roles (`ADMIN`): `space_id` must be `NULL`
- Space roles: `space_id` is required

## Authentication Flow

### First-Time Login

1. **User initiates login** with Google/Apple/Email
2. **System checks** if provider identity exists
3. **If identity exists**: Log user in
4. **If identity doesn't exist**:
   - Ask for mobile number
   - Send OTP to mobile
   - Verify OTP
   - Check if mobile number exists:
     - **Mobile exists**: Link new identity to existing user
     - **Mobile doesn't exist**: Create new user + identity

### Returning User Login

1. User signs in with any linked provider
2. System finds existing identity
3. User is logged in immediately

### Example Scenario

**User Journey**:
1. User signs up with Google (`abhinav@gmail.com`)
2. System asks for mobile: `+919876543210`
3. OTP verified → User created
4. Later, user signs in with Apple (`abhinav@icloud.com`)
5. System asks for mobile: `+919876543210`
6. OTP verified → Apple identity linked to existing user
7. User now has one account with two login methods

## API Endpoints

### Auth Module

#### POST /auth/google
Login with Google ID token.

**Request**:
```json
{
  "idToken": "google_id_token_here"
}
```

**Response**:
```json
{
  "accessToken": "jwt_token",
  "user": { ... },
  "requiresMobileVerification": false
}
```

Or if mobile verification needed:
```json
{
  "accessToken": "",
  "user": null,
  "requiresMobileVerification": true,
  "tempToken": "temporary_token_for_mobile_verification"
}
```

#### POST /auth/apple
Login with Apple identity token.

**Request**:
```json
{
  "identityToken": "apple_identity_token",
  "authorizationCode": "apple_auth_code"
}
```

#### POST /auth/email
Send OTP to email.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "OTP sent to email"
}
```

#### POST /auth/email/verify
Verify email OTP.

**Request**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### POST /auth/mobile/send-otp
Send OTP to mobile number.

**Request**:
```json
{
  "mobileNumber": "+919876543210",
  "tempToken": "temp_token_from_initial_auth"
}
```

#### POST /auth/verify-mobile
Verify mobile number with OTP.

**Request**:
```json
{
  "mobileNumber": "+919876543210",
  "otp": "123456",
  "tempToken": "temp_token_from_initial_auth"
}
```

**Response**:
```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "uuid",
    "mobileNumber": "+919876543210",
    "mobileVerified": true,
    "username": null,
    "fullName": null,
    "isOnboarded": false,
    ...
  },
  "requiresMobileVerification": false
}
```

#### GET /auth/session
Get current session (requires authentication).

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "user": { ... }
}
```

#### POST /auth/logout
Logout current user.

### Users Module

#### GET /users/me
Get current user profile.

#### PATCH /users/me
Update current user profile.

**Request**:
```json
{
  "username": "abhinavtej",
  "fullName": "Abhinav Tej",
  "bio": "Developer",
  "linkedinUrl": "https://linkedin.com/in/abhinavtej",
  "instagramUrl": "https://instagram.com/abhinavtej",
  "githubUrl": "https://github.com/abhinavtej",
  "websiteUrl": "https://abhinavtej.com"
}
```

#### POST /users/me/onboard
Mark user as onboarded.

#### POST /users/me/avatar
Upload user avatar (multipart/form-data).

**Form Data**:
- `avatar`: Image file (max 5MB, jpg/jpeg/png/webp)

#### POST /users/check-username
Check if username is available.

**Request**:
```json
{
  "username": "abhinavtej"
}
```

**Response**:
```json
{
  "available": true
}
```

#### GET /users/:username
Get user profile by username.

### Roles Module

#### GET /roles
Get all available roles.

#### GET /roles/users/:userId
Get roles assigned to a user.

#### POST /roles/assign
Assign role to user.

**Request**:
```json
{
  "userId": "user_uuid",
  "roleId": "role_uuid",
  "spaceId": "space_uuid" // Optional, required for space roles
}
```

#### DELETE /roles/:userRoleId
Remove role from user.

#### GET /roles/check/:userId/:roleCode
Check if user has specific role.

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Apple OAuth
APPLE_CLIENT_ID=your_apple_client_id

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Features

### JWT Authentication
- Access tokens expire in 7 days (configurable)
- Temporary tokens for mobile verification expire in 15 minutes
- Tokens are signed with HS256 algorithm

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can read/update their own data
- Users can read their own identities
- Users can read their own role assignments

### Input Validation
- Mobile numbers must be in E.164 format
- Usernames: 3-50 characters, lowercase, alphanumeric + underscore
- Email validation using class-validator
- File upload validation (size, type)

## Migration Guide

### Removing Old System

Delete these tables:
- `access_roles`
- `permissions`
- `role_permissions`
- `user_access`
- `user_access_audit_log`

### Running Migration

```bash
# Run the migration SQL
psql $DATABASE_URL -f migrations/001_create_auth_system.sql
```

### Updating Environment

Ensure all required environment variables are set in `.env`.

### Testing

1. Test Google login flow
2. Test Apple login flow
3. Test email OTP flow
4. Test mobile verification
5. Test identity linking
6. Test role assignment

## Best Practices

### Always Reference user_id
Never use email, mobile number, or provider ID in business logic. Always use `user_id`.

### Mobile Number Format
Always store mobile numbers in E.164 format: `+[country_code][number]`

Example: `+919876543210`

### Username Guidelines
- Lowercase only
- 3-50 characters
- Letters, numbers, underscores
- Must be unique

### Role Assignment
- Check role scope before assignment
- Platform roles: no space_id
- Space roles: require space_id
- Validate role exists before assignment

## Troubleshooting

### "Mobile number already exists"
This means the mobile number is already linked to another account. The system will automatically link the new identity to the existing account.

### "Invalid OTP"
- OTP expires after a certain time (configured in Supabase)
- Ensure OTP is entered correctly
- Request a new OTP if expired

### "Username already taken"
Use the `/users/check-username` endpoint to check availability before submission.

### "Platform roles cannot have a space_id"
When assigning ADMIN role, ensure `space_id` is null or not provided.

### "Space roles must have a space_id"
When assigning space roles (ORGANISER, MEMBER, etc.), `space_id` is required.

## Future Enhancements

- [ ] Token blacklisting for logout
- [ ] Refresh token implementation
- [ ] Social profile import (name, avatar from provider)
- [ ] Email verification for email identities
- [ ] Two-factor authentication
- [ ] Account deletion/deactivation
- [ ] Identity unlinking
- [ ] Admin dashboard for user management
