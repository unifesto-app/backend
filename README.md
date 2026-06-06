# Unifesto Backend API

Mobile-number-centric authentication and user management system built with NestJS, Prisma, and PostgreSQL.

## 🏗️ Architecture

### Tech Stack
- **Framework**: NestJS
- **Database**: PostgreSQL (AWS RDS)
- **ORM**: Prisma
- **Language**: TypeScript
- **Authentication**: JWT + OAuth (Google, Apple) + AWS Cognito
- **Storage**: AWS S3
- **Cache**: AWS ElastiCache (Valkey 7.2)

### Core Principles
1. **One person = One account = One verified mobile number**
2. **Prisma as single source of truth** for database schema
3. **Type-safe** database operations
4. **Mobile-first** authentication flow

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (AWS RDS)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with default roles
npm run prisma:seed

# Set up Supabase Storage (run once)
node setup-storage.js

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`

> **Note:** After running `setup-storage.js`, you need to create storage policies in Supabase Dashboard. See [docs/STORAGE_SETUP.md](docs/STORAGE_SETUP.md) for detailed instructions.

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (single source of truth)
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migrations
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── dto/              # Data transfer objects
│   │   ├── guards/           # Auth guards (JWT)
│   │   ├── decorators/       # Custom decorators
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                 # User management module
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── roles/                 # Role management module
│   │   ├── dto/
│   │   ├── roles.controller.ts
│   │   ├── roles.service.ts
│   │   └── roles.module.ts
│   ├── prisma/                # Prisma module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/                # Shared utilities
│   ├── types/                 # TypeScript types
│   ├── app.module.ts
│   └── main.ts
├── docs/
│   ├── AUTH_SYSTEM.md         # Authentication architecture
│   ├── PRISMA_INTEGRATION.md  # Prisma usage guide
│   └── openapi.yaml           # API specification
├── migrations/
│   └── 001_create_auth_system.sql  # Initial SQL migration
├── scripts/
│   └── migrate-auth.sh        # Migration helper script
├── .env.example               # Environment variables template
├── MIGRATION_GUIDE.md         # Migration instructions
└── package.json
```

## 🔐 Authentication Flow

### First-Time Login

1. User signs in with **Google/Apple/Email**
2. System checks if provider identity exists
3. If new identity:
   - Ask for mobile number
   - Send OTP to mobile
   - Verify OTP
   - Check if mobile exists:
     - **Exists**: Link identity to existing user
     - **New**: Create user + identity

### Returning User

1. User signs in with any linked provider
2. System finds existing identity
3. User logged in immediately

### Example: Multiple Login Methods

```
User Account: +919876543210
├── Google: abhinav@gmail.com
├── Apple: abhinav@icloud.com
└── Email: abhinavtej@gmail.com

All three methods access the same account!
```

## 📡 API Endpoints

### Authentication

```
POST   /auth/google              # Login with Google
POST   /auth/apple               # Login with Apple
POST   /auth/email               # Send email OTP
POST   /auth/email/verify        # Verify email OTP
POST   /auth/mobile/send-otp     # Send mobile OTP
POST   /auth/verify-mobile       # Verify mobile number
GET    /auth/session             # Get current session
POST   /auth/logout              # Logout
```

### Users

```
GET    /users/me                 # Get current user
PATCH  /users/me                 # Update profile
POST   /users/me/onboard         # Complete onboarding
POST   /users/me/avatar          # Upload avatar
POST   /users/check-username     # Check username availability
GET    /users/:username          # Get user by username
```

### Roles

```
GET    /roles                    # Get all roles
GET    /roles/users/:userId      # Get user roles
POST   /roles/assign             # Assign role to user
DELETE /roles/:userRoleId        # Remove role
GET    /roles/check/:userId/:roleCode  # Check if user has role
```

## 🗄️ Database Schema

### Users
- One person = one account
- Unique mobile number (canonical identity)
- Optional username, profile info

### User Identities
- Multiple auth methods per user
- Providers: GOOGLE, APPLE, EMAIL, PHONE
- Links to single user account

### Roles
- Platform scope: ADMIN
- Space scope: SUPER_ORGANISER, ORGANISER, CO_ORGANISER, MEMBER

### User Roles
- Role assignments to users
- Optional space context
- Audit trail (assigned_by)

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_secure_random_string
JWT_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
APPLE_CLIENT_ID=your_apple_client_id

# Server
PORT=3000
NODE_ENV=development
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📜 Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Create and apply migration
npm run prisma:migrate:deploy  # Apply migrations (production)
npm run prisma:studio      # Open Prisma Studio GUI
npm run prisma:seed        # Seed database
npm run prisma:reset       # Reset database (dev only)

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing

```bash
# Test Google login
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "google_id_token"}'

# Test get current user
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer your_jwt_token"
```

## 🚢 Deployment

### Build

```bash
npm run build
```

### Run Migrations

```bash
npm run prisma:migrate:deploy
```

### Start Server

```bash
npm run start:prod
```

### Environment

Ensure all environment variables are set in production:
- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `APPLE_CLIENT_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 📚 Documentation

- **[Authentication System](docs/AUTH_SYSTEM.md)** - Complete auth architecture
- **[Prisma Integration](docs/PRISMA_INTEGRATION.md)** - ORM usage guide
- **[OpenAPI Spec](docs/openapi.yaml)** - API specification
- **[Migration Guide](MIGRATION_GUIDE.md)** - Migration instructions

## 🔒 Security

### Authentication
- JWT tokens with configurable expiration
- Temporary tokens for mobile verification (15 min)
- OAuth integration (Google, Apple)
- OTP verification for mobile numbers

### Authorization
- Role-based access control (RBAC)
- Platform and space-scoped roles
- JWT guard for protected routes

### Data Protection
- Row Level Security (RLS) in database
- Input validation with class-validator
- SQL injection prevention via Prisma
- Secure password hashing (if implemented)

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check DATABASE_URL format
postgresql://user:password@host:port/database
```

### Prisma Client Not Generated

```bash
npm run prisma:generate
```

### Migration Conflicts

```bash
# Reset database (dev only)
npm run prisma:reset

# Or manually resolve
npx prisma migrate resolve --applied "migration_name"
```

### JWT Errors

- Ensure `JWT_SECRET` is set
- Check token expiration
- Verify token format: `Bearer <token>`

## 📈 Performance

### Database
- Indexes on frequently queried fields
- Connection pooling via Prisma
- Efficient queries with Prisma Client

### API
- Rate limiting (100 req/min default)
- Request throttling
- Caching strategies (implement as needed)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Write/update tests
4. Update documentation
5. Submit pull request

## 📄 License

UNLICENSED - Private project

## 👥 Team

Unifesto Development Team

## 🔗 Related Projects

- **[auth.unifesto.app](../auth)** - Authentication frontend
- **[app.unifesto.app]** - Main application

## 📞 Support

For issues or questions:
- Check documentation in `/docs`
- Review error logs
- Contact development team

---

Built with ❤️ using NestJS, Prisma, and PostgreSQL
