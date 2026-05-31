# Prisma Integration Guide

## Overview

Prisma has been integrated as the primary ORM for the Unifesto backend. All database operations now go through Prisma Client, providing type-safe database access and automatic migrations.

## Architecture

### Stack
- **NestJS**: Application framework
- **PostgreSQL**: Database (Supabase)
- **Prisma ORM**: Database access layer
- **TypeScript**: Type safety

### Key Principles
1. **Prisma is the single source of truth** for database schema
2. **No raw SQL** except for complex analytics queries
3. **Type-safe** database operations
4. **Automatic migrations** for schema changes

## Setup

### 1. Install Dependencies

Already installed:
```bash
npm install prisma @prisma/client
```

### 2. Configure Database Connection

Update your `.env` file:
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

For Supabase:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client based on your schema.

### 4. Run Migrations

```bash
# Development (creates migration + applies it)
npm run prisma:migrate

# Production (applies existing migrations)
npm run prisma:migrate:deploy
```

### 5. Seed Database

```bash
npm run prisma:seed
```

This creates the default roles (ADMIN, SUPER_ORGANISER, ORGANISER, CO_ORGANISER, MEMBER).

## Schema Overview

### Models

#### User
Core user entity representing a person.

```prisma
model User {
  id             String   @id @default(dbgenerated("gen_random_uuid()"))
  mobileNumber   String   @unique @map("mobile_number")
  mobileVerified Boolean  @default(false) @map("mobile_verified")
  username       String?  @unique
  fullName       String?  @map("full_name")
  avatarUrl      String?  @map("avatar_url")
  bio            String?
  linkedinUrl    String?  @map("linkedin_url")
  instagramUrl   String?  @map("instagram_url")
  githubUrl      String?  @map("github_url")
  websiteUrl     String?  @map("website_url")
  isOnboarded    Boolean  @default(false) @map("is_onboarded")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  
  identities     UserIdentity[]
  roles          UserRole[]
}
```

#### UserIdentity
Authentication methods linked to users.

```prisma
model UserIdentity {
  id             String   @id @default(dbgenerated("gen_random_uuid()"))
  userId         String   @map("user_id")
  provider       Provider
  providerUserId String   @map("provider_user_id")
  email          String?
  emailVerified  Boolean? @default(false) @map("email_verified")
  createdAt      DateTime @default(now()) @map("created_at")
  
  user           User     @relation(fields: [userId], references: [id])
}
```

#### Role
Role definitions.

```prisma
model Role {
  id        String    @id @default(dbgenerated("gen_random_uuid()"))
  code      RoleCode  @unique
  name      String
  scope     RoleScope
  createdAt DateTime  @default(now()) @map("created_at")
  
  userRoles UserRole[]
}
```

#### UserRole
Role assignments to users.

```prisma
model UserRole {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  userId     String   @map("user_id")
  roleId     String   @map("role_id")
  spaceId    String?  @map("space_id")
  assignedBy String?  @map("assigned_by")
  createdAt  DateTime @default(now()) @map("created_at")
  
  user       User     @relation(fields: [userId], references: [id])
  role       Role     @relation(fields: [roleId], references: [id])
}
```

### Enums

```prisma
enum Provider {
  GOOGLE
  APPLE
  EMAIL
  PHONE
}

enum RoleScope {
  PLATFORM
  SPACE
}

enum RoleCode {
  ADMIN
  SUPER_ORGANISER
  ORGANISER
  CO_ORGANISER
  MEMBER
}
```

## Usage Examples

### PrismaService

The `PrismaService` extends `PrismaClient` and is available globally:

```typescript
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}
}
```

### CRUD Operations

#### Create User

```typescript
const user = await this.prisma.user.create({
  data: {
    mobileNumber: '+919876543210',
    mobileVerified: true,
    identities: {
      create: {
        provider: Provider.GOOGLE,
        providerUserId: 'google_123',
        email: 'user@example.com',
        emailVerified: true,
      },
    },
  },
});
```

#### Find User

```typescript
// By ID
const user = await this.prisma.user.findUnique({
  where: { id: userId },
});

// By mobile number
const user = await this.prisma.user.findUnique({
  where: { mobileNumber: '+919876543210' },
});

// By username
const user = await this.prisma.user.findUnique({
  where: { username: 'johndoe' },
});
```

#### Update User

```typescript
const user = await this.prisma.user.update({
  where: { id: userId },
  data: {
    username: 'newusername',
    fullName: 'John Doe',
    bio: 'Software Developer',
  },
});
```

#### Delete User

```typescript
await this.prisma.user.delete({
  where: { id: userId },
});
```

### Relations

#### Include Related Data

```typescript
// User with identities
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  include: {
    identities: true,
  },
});

// User with roles
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  include: {
    roles: {
      include: {
        role: true,
      },
    },
  },
});
```

#### Create with Relations

```typescript
const user = await this.prisma.user.create({
  data: {
    mobileNumber: '+919876543210',
    mobileVerified: true,
    identities: {
      create: [
        {
          provider: Provider.GOOGLE,
          providerUserId: 'google_123',
          email: 'user@gmail.com',
        },
        {
          provider: Provider.APPLE,
          providerUserId: 'apple_456',
          email: 'user@icloud.com',
        },
      ],
    },
  },
  include: {
    identities: true,
  },
});
```

### Filtering & Querying

```typescript
// Find users with verified mobile
const users = await this.prisma.user.findMany({
  where: {
    mobileVerified: true,
  },
});

// Find users by provider
const users = await this.prisma.user.findMany({
  where: {
    identities: {
      some: {
        provider: Provider.GOOGLE,
      },
    },
  },
});

// Complex query
const users = await this.prisma.user.findMany({
  where: {
    AND: [
      { mobileVerified: true },
      { isOnboarded: true },
      {
        roles: {
          some: {
            role: {
              code: RoleCode.ADMIN,
            },
          },
        },
      },
    ],
  },
  include: {
    identities: true,
    roles: {
      include: {
        role: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
});
```

### Transactions

```typescript
// Create user and assign role in a transaction
const result = await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      mobileNumber: '+919876543210',
      mobileVerified: true,
    },
  });

  const role = await tx.role.findUnique({
    where: { code: RoleCode.MEMBER },
  });

  const userRole = await tx.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      spaceId: 'space_123',
    },
  });

  return { user, userRole };
});
```

## Naming Conventions

### Database (snake_case)
- Tables: `users`, `user_identities`, `roles`, `user_roles`
- Columns: `mobile_number`, `full_name`, `created_at`

### Application (camelCase)
- Models: `User`, `UserIdentity`, `Role`, `UserRole`
- Fields: `mobileNumber`, `fullName`, `createdAt`

### Mapping
Use `@map()` and `@@map()` to bridge the naming conventions:

```prisma
model User {
  mobileNumber String @map("mobile_number")
  
  @@map("users")
}
```

## Migration Workflow

### Creating Migrations

1. **Modify schema.prisma**
   ```prisma
   model User {
     // Add new field
     phoneVerifiedAt DateTime? @map("phone_verified_at")
   }
   ```

2. **Create migration**
   ```bash
   npm run prisma:migrate
   ```

3. **Name your migration**
   ```
   Enter a name for the new migration: add_phone_verified_at
   ```

4. **Review generated SQL**
   Check `prisma/migrations/[timestamp]_add_phone_verified_at/migration.sql`

5. **Apply migration**
   Migration is automatically applied in development

### Production Deployment

```bash
# Apply pending migrations
npm run prisma:migrate:deploy

# Generate Prisma Client
npm run prisma:generate
```

## Best Practices

### 1. Always Use Prisma for CRUD
❌ **Don't:**
```typescript
await this.supabase.from('users').select('*').eq('id', userId);
```

✅ **Do:**
```typescript
await this.prisma.user.findUnique({ where: { id: userId } });
```

### 2. Use Transactions for Related Operations
```typescript
await this.prisma.$transaction([
  this.prisma.user.create({ data: userData }),
  this.prisma.userIdentity.create({ data: identityData }),
]);
```

### 3. Include Relations When Needed
```typescript
// Only fetch what you need
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  include: {
    identities: true, // Only if needed
  },
});
```

### 4. Use Select for Specific Fields
```typescript
// Don't fetch all fields if you only need a few
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    username: true,
    fullName: true,
  },
});
```

### 5. Handle Errors Properly
```typescript
try {
  await this.prisma.user.create({ data: userData });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new ConflictException('User already exists');
  }
  throw error;
}
```

## Common Prisma Error Codes

- `P2002`: Unique constraint violation
- `P2003`: Foreign key constraint violation
- `P2025`: Record not found
- `P1001`: Can't reach database server
- `P1017`: Server has closed the connection

## Prisma Studio

View and edit your database in a GUI:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

## Type Safety

Prisma generates TypeScript types automatically:

```typescript
import { User, Provider, RoleCode } from '@prisma/client';

// Type-safe function
async function getUser(id: string): Promise<User> {
  return this.prisma.user.findUnique({ where: { id } });
}

// Type-safe enum
const provider: Provider = Provider.GOOGLE;
const roleCode: RoleCode = RoleCode.ADMIN;
```

## Testing

### Mock Prisma in Tests

```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const module = await Test.createTestingModule({
  providers: [
    MyService,
    {
      provide: PrismaService,
      useValue: mockPrismaService,
    },
  ],
}).compile();
```

## Performance Tips

### 1. Use Indexes
Already defined in schema for common queries:
- `mobileNumber` (unique index)
- `username` (unique index)
- `userId` in relations
- `provider` in identities

### 2. Batch Operations
```typescript
// Create multiple records at once
await this.prisma.user.createMany({
  data: [user1, user2, user3],
});
```

### 3. Connection Pooling
Prisma handles connection pooling automatically. Configure in `prisma.config.ts` if needed.

## Troubleshooting

### Issue: "Prisma Client not generated"
**Solution:**
```bash
npm run prisma:generate
```

### Issue: "Migration failed"
**Solution:**
1. Check database connection
2. Review migration SQL
3. Rollback if needed:
```bash
npx prisma migrate reset
```

### Issue: "Type errors after schema change"
**Solution:**
```bash
npm run prisma:generate
# Restart TypeScript server in your IDE
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [NestJS + Prisma](https://docs.nestjs.com/recipes/prisma)

## Next Steps

1. ✅ Prisma integrated
2. ✅ Schema defined
3. ✅ Services refactored
4. ⏳ Run migrations on your database
5. ⏳ Seed default roles
6. ⏳ Test all endpoints
7. ⏳ Deploy to production
