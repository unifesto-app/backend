# Deployment Checklist

Use this checklist before deploying to production.

## 📋 Pre-Deployment Checklist

### Environment Setup

- [ ] All environment variables configured
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `PORT` (if needed)
  - [ ] `CORS_ORIGIN` (production frontend URL)

### Database

- [ ] Profiles table created
- [ ] Indexes created
- [ ] Row Level Security (RLS) enabled
- [ ] RLS policies configured
- [ ] Trigger for `updated_at` created
- [ ] Test data cleaned up

### Code Quality

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No ESLint errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] All imports use `type` for interfaces

### Security

- [ ] `.env` file not committed to git
- [ ] Service role key kept secret
- [ ] JWT secret matches Supabase
- [ ] CORS configured for production domain only
- [ ] HTTPS enabled (in production)
- [ ] Rate limiting considered
- [ ] Input validation on all endpoints

### Testing

- [ ] Health check works: `GET /`
- [ ] Auth endpoints tested:
  - [ ] `GET /auth/me`
  - [ ] `POST /auth/sync`
  - [ ] `PATCH /auth/profile`
- [ ] Guards tested:
  - [ ] SupabaseAuthGuard blocks invalid tokens
  - [ ] RolesGuard enforces roles correctly
- [ ] Error responses verified
- [ ] Validation rules tested

### Documentation

- [ ] README.md reviewed
- [ ] API_TESTING.md reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Team onboarded

---

## 🚀 Deployment Steps

### Railway Deployment

1. **Create Railway Project**
   ```bash
   # Install Railway CLI (optional)
   npm install -g @railway/cli
   ```

2. **Connect Repository**
   - Go to [Railway Dashboard](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**
   - Go to project settings
   - Add all environment variables:
     ```
     NODE_ENV=production
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     SUPABASE_JWT_SECRET=your-jwt-secret
     CORS_ORIGIN=https://your-frontend.com
     ```

4. **Deploy**
   - Railway auto-detects Node.js
   - Uses `npm run start:prod` automatically
   - Monitor deployment logs

5. **Verify Deployment**
   ```bash
   # Test health endpoint
   curl https://your-app.railway.app
   
   # Test auth endpoint (with valid token)
   curl https://your-app.railway.app/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Vercel Deployment (Alternative)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/main.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/main.js"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "run", "start:prod"]
   ```

2. **Build Image**
   ```bash
   docker build -t unifesto-backend .
   ```

3. **Run Container**
   ```bash
   docker run -p 3000:3000 --env-file .env unifesto-backend
   ```

---

## ✅ Post-Deployment Verification

### Smoke Tests

1. **Health Check**
   ```bash
   curl https://your-api.com
   # Expected: "Hello World!"
   ```

2. **Auth Endpoint (with valid token)**
   ```bash
   curl https://your-api.com/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   # Expected: User profile JSON
   ```

3. **Invalid Token**
   ```bash
   curl https://your-api.com/auth/me \
     -H "Authorization: Bearer invalid"
   # Expected: 401 Unauthorized
   ```

4. **CORS Check**
   ```bash
   curl -H "Origin: https://your-frontend.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS https://your-api.com/auth/me
   # Expected: CORS headers in response
   ```

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure logging aggregation
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors
- [ ] Monitor API response times

### Performance

- [ ] API response time < 200ms
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Proper indexes on database
- [ ] Connection pooling configured

---

## 🔧 Troubleshooting

### Deployment Fails

**Check:**
1. Build succeeds locally: `npm run build`
2. All dependencies in `package.json`
3. Node version matches (20+)
4. Environment variables set correctly

### API Returns 500 Errors

**Check:**
1. Environment variables set in production
2. Database connection works
3. Supabase credentials correct
4. Check application logs

### Authentication Fails

**Check:**
1. `SUPABASE_JWT_SECRET` matches Supabase project
2. Token format: `Bearer <token>`
3. Token not expired
4. CORS configured correctly

### Database Errors

**Check:**
1. Profiles table exists
2. RLS policies configured
3. Service role key has permissions
4. Connection string correct

---

## 📊 Monitoring Checklist

### Application Metrics

- [ ] Request rate
- [ ] Error rate
- [ ] Response time (p50, p95, p99)
- [ ] Active connections
- [ ] Memory usage
- [ ] CPU usage

### Business Metrics

- [ ] New user registrations
- [ ] Active users
- [ ] Profile updates
- [ ] Failed authentication attempts

### Alerts

- [ ] Error rate > 5%
- [ ] Response time > 1s
- [ ] Memory usage > 80%
- [ ] Database connection failures
- [ ] High authentication failure rate

---

## 🔐 Security Checklist

### Production Security

- [ ] HTTPS enabled
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (input validation)
- [ ] CSRF protection (if needed)
- [ ] Security headers configured
- [ ] Secrets not in code/logs
- [ ] Regular dependency updates
- [ ] Security audit performed

### Supabase Security

- [ ] RLS enabled on all tables
- [ ] Service role key secured
- [ ] JWT secret secured
- [ ] Database backups enabled
- [ ] Access logs monitored

---

## 📝 Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # Railway: Revert to previous deployment
   # Vercel: Revert to previous deployment
   # Docker: Use previous image tag
   ```

2. **Database Rollback**
   - Keep migration scripts
   - Test rollback locally first
   - Have backup ready

3. **Communication**
   - Notify team
   - Update status page
   - Document issue

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ All endpoints respond correctly
- ✅ Authentication works
- ✅ Database operations succeed
- ✅ No errors in logs
- ✅ Response times acceptable
- ✅ CORS works from frontend
- ✅ Monitoring active
- ✅ Team can access

---

## 📞 Support Contacts

- **Supabase Support**: https://supabase.com/support
- **Railway Support**: https://railway.app/help
- **Team Lead**: [Your contact]
- **DevOps**: [Your contact]

---

## 📚 Additional Resources

- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Railway Docs](https://docs.railway.app)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Good luck with your deployment! 🚀**
