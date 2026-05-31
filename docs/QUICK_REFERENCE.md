# Quick Reference Guide

## Common Commands

### Development
```bash
npm run start:dev              # Start dev server
npm run prisma:studio          # Open database GUI
npm run prisma:generate        # Generate Prisma Client
```

### Database
```bash
npm run prisma:migrate         # Create & apply migration
npm run prisma:seed            # Seed default data
npm run prisma:reset           # Reset database (dev only)
```

### Production
```bash
npm run build                  # Build application
npm run prisma:migrate:deploy  # Apply migrations
npm run start:prod             # Start production server
```

## Common Prisma Queries

### Find User
```typescript
// By ID
await prisma.user.findUnique({ where: { id: userId } });

// By mobile
await prisma.user.findUnique({ where: { mobileNumber: '+919876543210' } });

// By username
await prisma.user.findUnique({ where: { username: 'johndoe' } });

// With relations
await prisma.user.findUnique({
  where: { id: userId },
  include: { identities: true, roles: true },
});
```

### Create User
```typescript
await prisma.user.create({
  data: {
    mobileNumber: '+919876543210',
    mobileVerified: true,
    identities: {
      create: {
        provider: Provider.GOOGLE,
        providerUserId: 'google_123',
        email: 'user@example.com',
      },
    },
  },
});
```

### Update User
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { username: 'newusername', fullName: 'John Doe' },
});
```

### Assign Role
```typescript
await prisma.userRole.create({
  data: {
    userId: 'user_id',
    roleId: 'role_id',
    spaceId: 'space_id', // null for platform roles
    assignedBy: 'admin_id',
  },
});
```

## API Examples

### Authentication
```bash
# Google Login
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "google_token"}'

# Verify Mobile
curl -X POST http://localhost:3000/auth/verify-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "+919876543210",
    "otp": "123456",
    "tempToken": "temp_token"
  }'

# Get Session
curl -X GET http://localhost:3000/auth/session \
  -H "Authorization: Bearer jwt_token"
```

### User Management
```bash
# Get Profile
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer jwt_token"

# Update Profile
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "fullName": "John Doe"}'

# Check Username
curl -X POST http://localhost:3000/users/check-username \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe"}'
```

### Role Management
```bash
# Get All Roles
curl -X GET http://localhost:3000/roles \
  -H "Authorization: Bearer jwt_token"

# Assign Role
curl -X POST http://localhost:3000/roles/assign \
  -H "Authorization: Bearer jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "roleId": "role_id",
    "spaceId": "space_id"
  }'
```

## Environment Variables

### Required
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_client_id
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=your_key
```

### Optional
```env
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
APPLE_CLIENT_ID=com.unifesto.app
```

## Database Schema Quick View

### Tables
- `users` - User accounts
- `user_identities` - Auth methods
- `roles` - Role definitions
- `user_roles` - Role assignments

### Key Relationships
```
User (1) ←→ (N) UserIdentity
User (1) ←→ (N) UserRole
Role (1) ←→ (N) UserRole
```

### Enums
- **Provider**: GOOGLE, APPLE, EMAIL, PHONE
- **RoleScope**: PLATFORM, SPACE
- **RoleCode**: ADMIN, SUPER_ORGANISER, ORGANISER, CO_ORGANISER, MEMBER

## Common Errors

### P2002: Unique Constraint
```typescript
// Username or mobile already exists
if (error.code === 'P2002') {
  throw new ConflictException('Already exists');
}
```

### P2025: Record Not Found
```typescript
// User not found
if (error.code === 'P2025') {
  throw new NotFoundException('Not found');
}
```

### JWT Expired
```typescript
// Token expired
throw new UnauthorizedException('Token expired');
```

## Role Assignment Rules

### Platform Roles
- Code: `ADMIN`
- `spaceId` must be `null`
- Global access

### Space Roles
- Codes: `SUPER_ORGANISER`, `ORGANISER`, `CO_ORGANISER`, `MEMBER`
- `spaceId` is required
- Space-specific access

## Testing Checklist

- [ ] Google login works
- [ ] Apple login works
- [ ] Email OTP works
- [ ] Mobile verification works
- [ ] Identity linking works
- [ ] Profile updates work
- [ ] Username validation works
- [ ] Role assignment works
- [ ] Role scope validation works
- [ ] Avatar upload works

## Deployment Checklist

- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Default roles seeded
- [ ] JWT secret configured
- [ ] OAuth credentials configured
- [ ] Supabase storage configured
- [ ] Build successful
- [ ] Health check passes
- [ ] API endpoints accessible

## Useful Links

- Prisma Studio: `http://localhost:5555`
- API Docs: `docs/openapi.yaml`
- Auth Guide: `docs/AUTH_SYSTEM.md`
- Prisma Guide: `docs/PRISMA_INTEGRATION.md`

## Support

- Check logs: `npm run start:dev`
- Database GUI: `npm run prisma:studio`
- Generate types: `npm run prisma:generate`
- Reset DB: `npm run prisma:reset` (dev only)
