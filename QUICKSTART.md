# Quick Start Guide

Get the Unifesto backend up and running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- Supabase project created
- PostgreSQL database (via Supabase)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

CORS_ORIGIN=http://localhost:3001
```

### Where to find Supabase credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

## Step 3: Set Up Database

Run the SQL migration in your Supabase SQL Editor:

```bash
# Copy the SQL from database/migrations/001_create_profiles_table.sql
# Paste and run it in Supabase SQL Editor
```

Or directly in Supabase:

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy contents of `database/migrations/001_create_profiles_table.sql`
4. Click **Run**

## Step 4: Start the Server

### Development Mode (with hot reload)

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

## Step 5: Test the API

### Health Check

```bash
curl http://localhost:3000
```

Expected response:
```json
"Hello World!"
```

### Test Authentication (requires valid JWT)

```bash
# Replace YOUR_JWT_TOKEN with actual token from Supabase
curl -X POST http://localhost:3000/auth/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
backend/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── decorators/          # Custom decorators
│   │   ├── dto/                 # Data transfer objects
│   │   ├── guards/              # Auth & role guards
│   │   ├── interfaces/          # TypeScript interfaces
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── auth.module.ts       # Auth module
│   ├── common/
│   │   └── database/            # Database services
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Entry point
├── database/
│   └── migrations/              # SQL migrations
├── .env                         # Environment variables (create this)
├── .env.example                 # Example env file
└── package.json
```

## Available Scripts

```bash
# Development
npm run start:dev        # Start with hot reload

# Production
npm run build           # Build for production
npm run start:prod      # Start production server

# Code Quality
npm run format          # Format code with Prettier
npm run lint            # Lint code with ESLint
```

## API Endpoints

### Public Endpoints
- `GET /` - Health check

### Protected Endpoints (require JWT)
- `GET /auth/me` - Get current user profile
- `POST /auth/sync` - Sync/create user profile
- `PATCH /auth/profile` - Update user profile

See [API_TESTING.md](./API_TESTING.md) for detailed API documentation.

## Common Issues

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3002 npm run start:dev
```

### "JWT secret not configured"

Make sure `SUPABASE_JWT_SECRET` is set in your `.env` file.

### "Profile not found"

User needs to call `POST /auth/sync` after first login to create their profile.

### Database connection errors

Verify:
1. `SUPABASE_URL` is correct
2. `SUPABASE_SERVICE_ROLE_KEY` is correct (not the anon key)
3. Database is accessible

## Next Steps

1. ✅ Server running
2. ✅ Database configured
3. 📖 Read [README.md](./README.md) for full documentation
4. 🧪 Read [API_TESTING.md](./API_TESTING.md) for testing guide
5. 🚀 Deploy to Railway/Vercel/your platform

## Deployment

### Railway

1. Create new project on Railway
2. Connect GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy automatically

### Docker

```bash
docker build -t unifesto-backend .
docker run -p 3000:3000 --env-file .env unifesto-backend
```

## Support

For issues or questions:
1. Check [README.md](./README.md) troubleshooting section
2. Review [API_TESTING.md](./API_TESTING.md)
3. Check Supabase logs
4. Check backend logs

## Security Checklist

Before going to production:

- [ ] Change all default credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure rate limiting (if needed)
- [ ] Review Supabase RLS policies
- [ ] Secure environment variables
- [ ] Set up monitoring

---

**You're all set! 🎉**

The backend is now ready to handle authentication and user profile management.
