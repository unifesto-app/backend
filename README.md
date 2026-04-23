# Unifesto Backend API

Production-ready NestJS backend with Supabase authentication.

## Features

- ✅ Supabase JWT authentication
- ✅ User profile management
- ✅ Role-based access control (RBAC)
- ✅ Input validation with class-validator
- ✅ Clean architecture (modules, services, guards)
- ✅ Comprehensive error handling
- ✅ Logging with NestJS Logger
- ✅ TypeScript strict mode

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Validation**: class-validator, class-transformer
- **Runtime**: Node.js 20+

## Project Structure

```
src/
├── auth/
│   ├── decorators/
│   │   ├── current-user.decorator.ts    # Extract user from request
│   │   └── roles.decorator.ts           # Role-based access decorator
│   ├── dto/
│   │   └── update-profile.dto.ts        # Profile update validation
│   ├── guards/
│   │   ├── supabase-auth.guard.ts       # JWT verification
│   │   └── roles.guard.ts               # Role-based authorization
│   ├── interfaces/
│   │   └── user.interface.ts            # User types & enums
│   ├── auth.controller.ts               # Auth endpoints
│   ├── auth.service.ts                  # Auth business logic
│   └── auth.module.ts                   # Auth module
├── common/
│   └── database/
│       ├── supabase.service.ts          # Supabase client
│       └── database.module.ts           # Database module
├── app.module.ts                        # Root module
└── main.ts                              # Application entry point
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Database Schema

The backend expects a `profiles` table in your Supabase database:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('attendee', 'super_admin', 'support')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Create index on email for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access"
  ON profiles
  USING (auth.jwt()->>'role' = 'service_role');
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## API Endpoints

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

#### GET /auth/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "name": "John Doe",
    "username": "johndoe",
    "avatar_url": "https://...",
    "bio": "Software developer",
    "phone": "+1234567890",
    "role": "attendee",
    "is_verified": false,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /auth/sync

Sync user profile (creates profile if it doesn't exist).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Profile synced successfully",
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "attendee",
    ...
  }
}
```

#### PATCH /auth/profile

Update user profile.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Software developer",
  "phone": "+1234567890"
}
```

**Validation Rules:**
- `name`: 2-100 characters
- `username`: 3-30 characters, alphanumeric + underscore/hyphen only
- `avatar_url`: Valid URL, max 500 characters
- `bio`: Max 500 characters
- `phone`: Valid phone number format

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    ...
  }
}
```

## Guards & Decorators

### SupabaseAuthGuard

Verifies Supabase JWT tokens and attaches user to request.

```typescript
@Get('protected')
@UseGuards(SupabaseAuthGuard)
async protectedRoute(@CurrentUser() user: RequestUser) {
  return { userId: user.sub };
}
```

### RolesGuard

Checks user roles from database (requires SupabaseAuthGuard).

```typescript
@Get('admin-only')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
async adminRoute() {
  return { message: 'Admin access granted' };
}
```

### @CurrentUser() Decorator

Extracts authenticated user from request.

```typescript
@Get('me')
@UseGuards(SupabaseAuthGuard)
async getMe(@CurrentUser() user: RequestUser) {
  // user.sub = user ID
  // user.email = user email
  // user.role = user role (from JWT)
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., username already taken)
- `500` - Internal Server Error

## User Roles

```typescript
enum UserRole {
  ATTENDEE = 'attendee',      // Default role for new users
  SUPER_ADMIN = 'super_admin', // Full system access
  SUPPORT = 'support',         // Customer support access
}
```

## Development

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests (when added)
npm run test
```

## Deployment

### Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Railway will automatically detect and deploy using `npm run start:prod`

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

## Security Best Practices

✅ JWT tokens are verified on every request  
✅ Service role key is never exposed to clients  
✅ Input validation on all endpoints  
✅ CORS configured for specific origins  
✅ Row Level Security enabled on database  
✅ User status checks (banned/inactive)  
✅ Comprehensive logging for security events  

## Troubleshooting

### "JWT secret not configured"

Make sure `SUPABASE_JWT_SECRET` is set in your `.env` file.

### "Profile not found"

User needs to call `POST /auth/sync` after first login to create their profile.

### "Username already taken"

The username must be unique across all users. Try a different username.

### Port already in use

Change the `PORT` in your `.env` file or kill the process using the port:

```bash
lsof -ti:3000 | xargs kill -9
```

## License

UNLICENSED - Private project
