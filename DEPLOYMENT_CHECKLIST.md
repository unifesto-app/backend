# 📋 Email System Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Implementation
- [x] All 55 email methods implemented
- [x] All 55 HTML templates created
- [x] Admin email service created
- [x] Admin email controller created  
- [x] Module integration complete
- [x] TypeScript compilation successful
- [x] No build errors

### ✅ Database
- [x] EmailCampaign model added to schema
- [x] EmailCampaignLog model added to schema
- [x] Migration file created
- [ ] **TODO: Apply migration to database**

### ⚠️ Environment Configuration
- [ ] **TODO: Set RESEND_API_KEY in .env**
- [ ] **TODO: Set AWS_SES_REGION in .env**
- [ ] **TODO: Set EMAIL_FROM_TRANSACTIONAL in .env**
- [ ] **TODO: Set EMAIL_FROM_BULK in .env**
- [ ] **TODO: Set ADMIN_EMAIL in .env**
- [ ] **TODO: Verify S3_BUCKET_URL is set**

### ⚠️ AWS Configuration
- [ ] **TODO: Verify AWS SES account is set up**
- [ ] **TODO: Verify email addresses/domains verified in SES**
- [ ] **TODO: Check SES sending limits**
- [ ] **TODO: Request production access if in sandbox**

### ⚠️ Resend Configuration  
- [ ] **TODO: Create Resend account**
- [ ] **TODO: Get API key**
- [ ] **TODO: Add sender domain**
- [ ] **TODO: Verify domain DNS records**

---

## Deployment Steps

### Step 1: Apply Database Migration
```bash
cd backend
npx prisma migrate deploy
```

**Expected Output:**
```
Applying migration `20260607000000_add_email_campaigns`
Database is now in sync with Prisma schema.
```

### Step 2: Configure Environment Variables

Create or update `.env`:
```env
# Resend (transactional emails)
RESEND_API_KEY=re_XXXXXXXXXXXXX
EMAIL_FROM_TRANSACTIONAL=no-reply@notify.unifesto.app

# AWS SES (bulk emails)
AWS_SES_REGION=ap-south-1
EMAIL_FROM_BULK=no-reply@updates.unifesto.app

# Admin notifications
ADMIN_EMAIL=admin@unifesto.app

# S3 for email assets (logo, images)
S3_BUCKET_URL=https://unifesto-assets.s3.ap-south-1.amazonaws.com
```

### Step 3: Restart Application
```bash
# Development
npm run start:dev

# Production
pm2 restart unifesto-backend
```

### Step 4: Verify Services Started
Check logs for:
```
[EmailService] Email service initialized
[AdminEmailService] Admin email service initialized
[NestApplication] Nest application successfully started
```

---

## Post-Deployment Testing

### Test 1: Send OTP Email (Transactional via Resend)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+919876543210"}'
```

**Expected:** OTP email sent to registered user

### Test 2: Send Admin Campaign (Bulk via SES)
```bash
# First, get admin JWT token
TOKEN="your-admin-jwt-token-here"

# Send to specific user
curl -X POST http://localhost:3000/admin/email/send-to-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "user-uuid-here",
    "subject": "Test Campaign",
    "body": "<h1>Hello</h1><p>This is a test email</p>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "campaignId": "uuid-here"
}
```

### Test 3: List Campaigns
```bash
curl http://localhost:3000/admin/email/campaigns?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** List of campaigns with pagination

### Test 4: Check Campaign Logs
```bash
curl http://localhost:3000/admin/email/campaigns/<campaign-id> \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Campaign details with send logs

---

## Monitoring Checklist

### Application Logs
Monitor for:
- [ ] Email service initialization messages
- [ ] Campaign processing start/complete messages
- [ ] Any error messages related to email sending

### Database
Check:
- [ ] `email_campaigns` table has records
- [ ] `email_campaign_logs` table has send logs
- [ ] Status updates are working (PENDING → SENDING → SENT)

### Email Delivery
Monitor:
- [ ] Resend dashboard for transactional email stats
- [ ] AWS SES dashboard for bulk email stats
- [ ] Bounce/complaint rates
- [ ] Delivery success rates

---

## Troubleshooting

### Issue: Migration fails
**Solution:**
```bash
# Check migration status
npx prisma migrate status

# If needed, reset and reapply
npx prisma migrate reset
npx prisma migrate deploy
```

### Issue: "RESEND_API_KEY not configured" warning
**Solution:** Add RESEND_API_KEY to .env file

### Issue: SES emails not sending
**Possible causes:**
1. SES account in sandbox mode (verify recipient emails)
2. Invalid AWS credentials
3. Region mismatch
4. Email not verified in SES

**Solution:**
- Check AWS SES console
- Verify sender/recipient emails
- Request production access if needed

### Issue: "Property 'emailCampaignLog' does not exist"
**Solution:** Regenerate Prisma client
```bash
npx prisma generate
```

### Issue: Admin endpoints return 403 Forbidden
**Cause:** User doesn't have ADMIN role

**Solution:** Verify JWT token contains ADMIN role

---

## Rollback Plan

If issues occur:

### 1. Revert Code Changes
```bash
git revert <commit-hash>
```

### 2. Rollback Database Migration
```bash
npx prisma migrate resolve --rolled-back 20260607000000_add_email_campaigns
```

### 3. Restart Application
```bash
pm2 restart unifesto-backend
```

---

## Success Metrics

After 24 hours, verify:
- [ ] At least 1 transactional email sent successfully
- [ ] At least 1 campaign created (if admin tested)
- [ ] No errors in application logs
- [ ] Email delivery rate > 95%
- [ ] No increase in error rates

---

## Security Review

Before production:
- [ ] JWT authentication working on admin endpoints
- [ ] Only ADMIN role can access campaign endpoints
- [ ] Rate limiting configured
- [ ] Input validation working
- [ ] SQL injection protection (via Prisma)
- [ ] XSS protection in email templates

---

## Performance Baseline

Expected performance:
- **Transactional emails:** < 2 seconds per email
- **Bulk campaigns:** 100 emails per batch, ~1 batch per second
- **API response times:** < 200ms
- **Database queries:** < 100ms

---

## Completion Sign-Off

- [ ] Database migration applied successfully
- [ ] Environment variables configured
- [ ] Application restarted
- [ ] Test emails sent and received
- [ ] Admin campaigns tested
- [ ] Logs show no errors
- [ ] Monitoring dashboards reviewed

**Deployed by:** _____________  
**Date:** _____________  
**Time:** _____________  
**Environment:** Production / Staging  

---

## 📞 Support Contacts

**Development Team:** dev@unifesto.app  
**Infrastructure:** devops@unifesto.app  
**Emergency:** +91-XXXX-XXXXXX  

---

**Next Review:** 7 days after deployment  
**Documentation:** See `EMAIL_SYSTEM_COMPLETE.md` and `IMPLEMENTATION_SUMMARY.md`
