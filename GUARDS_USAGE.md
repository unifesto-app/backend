# Guards & Decorators Usage Guide

Complete guide on using authentication guards and role-based access control in your NestJS backend.

## Table of Contents

1. [SupabaseAuthGuard](#supabaseauthguard)
2. [RolesGuard](#rolesguard)
3. [CurrentUser Decorator](#currentuser-decorator)
4. [Roles Decorator](#roles-decorator)
5. [Real-World Examples](#real-world-examples)

---

## SupabaseAuthGuard

Verifies Supabase JWT tokens and attaches user information to the request.

### Basic Usage

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(SupabaseAuthGuard)
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
```

### What it does:

1. Extracts JWT from `Authorization: Bearer <token>` header
2. Verifies token using `SUPABASE_JWT_SECRET`
3. Attaches decoded user to `request.user`
4. Throws `UnauthorizedException` if token is invalid/missing

### Error Responses:

```typescript
// No token
{
  "statusCode": 401,
  "message": "No authorization token provided",
  "error": "Unauthorized"
}

// Invalid token
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}

// Expired token
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "Unauthorized"
}
```

---

## RolesGuard

Checks if authenticated user has required role(s). Must be used with `SupabaseAuthGuard`.

### Basic Usage

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from './auth/interfaces/user.interface';

@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN)
  getDashboard() {
    return { message: 'Admin dashboard data' };
  }
}
```

### What it does:

1. Checks if route has `@Roles()` decorator
2. Fetches user profile from database
3. Checks if user is banned or inactive
4. Verifies user has one of the required roles
5. Throws `ForbiddenException` if unauthorized

### Error Responses:

```typescript
// Insufficient permissions
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// Banned user
{
  "statusCode": 403,
  "message": "Account has been banned",
  "error": "Forbidden"
}

// Inactive user
{
  "statusCode": 403,
  "message": "Account is inactive",
  "error": "Forbidden"
}
```

---

## CurrentUser Decorator

Extracts authenticated user from request. Use with `SupabaseAuthGuard`.

### Basic Usage

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import type { RequestUser } from './auth/interfaces/user.interface';

@Controller('user')
export class UserController {
  @Get('info')
  @UseGuards(SupabaseAuthGuard)
  getUserInfo(@CurrentUser() user: RequestUser) {
    return {
      userId: user.sub,
      email: user.email,
      role: user.role
    };
  }
}
```

### RequestUser Interface

```typescript
interface RequestUser {
  sub: string;      // User ID from JWT
  email?: string;   // User email from JWT
  role?: string;    // User role from JWT (may not match DB)
}
```

---

## Roles Decorator

Specifies which roles can access a route. Use with `RolesGuard`.

### Basic Usage

```typescript
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from './auth/interfaces/user.interface';

// Single role
@Roles(UserRole.SUPER_ADMIN)

// Multiple roles
@Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT)
```

### Available Roles

```typescript
enum UserRole {
  ATTENDEE = 'attendee',        // Default role
  SUPER_ADMIN = 'super_admin',  // Full access
  SUPPORT = 'support',          // Support team access
}
```

---

## Real-World Examples

### Example 1: Public Endpoint

No authentication required.

```typescript
@Controller('events')
export class EventsController {
  @Get()
  getAllEvents() {
    // Anyone can access this
    return this.eventsService.findAll();
  }
}
```

### Example 2: Protected Endpoint

Requires authentication, any role.

```typescript
@Controller('events')
export class EventsController {
  @Post()
  @UseGuards(SupabaseAuthGuard)
  createEvent(
    @CurrentUser() user: RequestUser,
    @Body() createEventDto: CreateEventDto
  ) {
    // Any authenticated user can create events
    return this.eventsService.create(user.sub, createEventDto);
  }
}
```

### Example 3: Role-Based Access

Only specific roles can access.

```typescript
@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  getAllUsers() {
    // Only super_admin and support can access
    return this.usersService.findAll();
  }

  @Delete('users/:id')
  @Roles(UserRole.SUPER_ADMIN)
  deleteUser(@Param('id') id: string) {
    // Only super_admin can delete users
    return this.usersService.delete(id);
  }
}
```

### Example 4: Controller-Level Guards

Apply guards to entire controller.

```typescript
@Controller('profile')
@UseGuards(SupabaseAuthGuard)
export class ProfileController {
  // All routes in this controller require authentication

  @Get()
  getProfile(@CurrentUser() user: RequestUser) {
    return this.profileService.findOne(user.sub);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateDto: UpdateProfileDto
  ) {
    return this.profileService.update(user.sub, updateDto);
  }
}
```

### Example 5: Mixed Access Levels

Different routes, different access levels.

```typescript
@Controller('organizations')
export class OrganizationsController {
  // Public: Anyone can view organizations
  @Get()
  findAll() {
    return this.orgsService.findAll();
  }

  // Protected: Authenticated users can create
  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateOrgDto
  ) {
    return this.orgsService.create(user.sub, createDto);
  }

  // Role-based: Only admins can delete
  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.orgsService.delete(id);
  }
}
```

### Example 6: Custom Authorization Logic

For complex authorization (e.g., organization membership).

```typescript
@Controller('events')
export class EventsController {
  constructor(
    private eventsService: EventsService,
    private orgsService: OrganizationsService
  ) {}

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  async updateEvent(
    @CurrentUser() user: RequestUser,
    @Param('id') eventId: string,
    @Body() updateDto: UpdateEventDto
  ) {
    // Get event
    const event = await this.eventsService.findOne(eventId);
    
    // Check if user is organizer of this event's organization
    const membership = await this.orgsService.getMembership(
      user.sub,
      event.organization_id
    );

    if (!membership || !['organizer', 'admin'].includes(membership.role)) {
      throw new ForbiddenException('Not authorized to edit this event');
    }

    return this.eventsService.update(eventId, updateDto);
  }
}
```

### Example 7: Conditional Guards

Apply guards conditionally based on environment.

```typescript
@Controller('debug')
export class DebugController {
  @Get('info')
  @UseGuards(
    ...(process.env.NODE_ENV === 'production' 
      ? [SupabaseAuthGuard, RolesGuard] 
      : []
    )
  )
  @Roles(UserRole.SUPER_ADMIN)
  getDebugInfo() {
    // In development: open access
    // In production: super_admin only
    return { env: process.env.NODE_ENV };
  }
}
```

### Example 8: Global Guards (Optional)

Apply authentication globally in `main.ts`.

```typescript
// main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply SupabaseAuthGuard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new SupabaseAuthGuard(reflector));
  
  await app.listen(3000);
}
bootstrap();
```

Then use `@Public()` decorator for public routes:

```typescript
// Create public decorator
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Use in controller
@Controller('events')
export class EventsController {
  @Get()
  @Public()
  findAll() {
    // Public route, skips global guard
    return this.eventsService.findAll();
  }
}
```

---

## Best Practices

### 1. Always use SupabaseAuthGuard before RolesGuard

```typescript
// ✅ Correct
@UseGuards(SupabaseAuthGuard, RolesGuard)

// ❌ Wrong - RolesGuard needs user from SupabaseAuthGuard
@UseGuards(RolesGuard, SupabaseAuthGuard)
```

### 2. Use type imports for RequestUser

```typescript
// ✅ Correct
import type { RequestUser } from './auth/interfaces/user.interface';

// ❌ Wrong - causes TypeScript decorator metadata issues
import { RequestUser } from './auth/interfaces/user.interface';
```

### 3. Validate user ownership in service layer

```typescript
// ✅ Correct - validate in service
async updateProfile(userId: string, dto: UpdateProfileDto) {
  const profile = await this.getProfile(userId);
  // Validation logic here
  return this.update(profile.id, dto);
}

// ❌ Wrong - trusting controller input
async updateProfile(profileId: string, dto: UpdateProfileDto) {
  return this.update(profileId, dto); // No ownership check!
}
```

### 4. Use specific roles, not generic strings

```typescript
// ✅ Correct
@Roles(UserRole.SUPER_ADMIN)

// ❌ Wrong - typos won't be caught
@Roles('super_admin')
```

### 5. Log authorization failures

```typescript
// Already implemented in guards
this.logger.warn(`User ${user.sub} attempted unauthorized access`);
```

---

## Testing Guards

### Unit Testing

```typescript
import { Test } from '@nestjs/testing';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SupabaseAuthGuard],
    }).compile();

    guard = module.get<SupabaseAuthGuard>(SupabaseAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // Add more tests...
});
```

### Integration Testing

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const validToken = 'your-test-jwt-token';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/me (GET) - success', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });

  it('/auth/me (GET) - unauthorized', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## Troubleshooting

### Guard not working

1. Check guard is imported and added to `@UseGuards()`
2. Verify environment variables are set
3. Check token format: `Bearer <token>`
4. Verify JWT secret matches Supabase

### RolesGuard always denies access

1. Ensure SupabaseAuthGuard is applied first
2. Check user profile exists in database
3. Verify role in database matches enum values
4. Check user is not banned/inactive

### CurrentUser returns undefined

1. Ensure SupabaseAuthGuard is applied
2. Check token is valid
3. Verify decorator is imported correctly

---

## Summary

| Guard | Purpose | Requires | Throws |
|-------|---------|----------|--------|
| SupabaseAuthGuard | Verify JWT | Valid token | 401 Unauthorized |
| RolesGuard | Check roles | SupabaseAuthGuard + @Roles() | 403 Forbidden |

| Decorator | Purpose | Use With |
|-----------|---------|----------|
| @CurrentUser() | Get user from request | SupabaseAuthGuard |
| @Roles() | Specify required roles | RolesGuard |

---

**You're now ready to implement secure, role-based authentication in your NestJS backend! 🔐**
