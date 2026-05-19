# WhatsApp Templates - Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` added to `.env`
- [ ] `WHATSAPP_ACCESS_TOKEN` is valid and not expired
- [ ] `WHATSAPP_PHONE_NUMBER_ID` is correct
- [ ] `WHATSAPP_WEBHOOK_SECRET` is configured
- [ ] All environment variables are set in production environment

### 2. Database Migration
- [ ] Backup existing database
- [ ] Test migration on staging/dev database first
- [ ] Run `update_whatsapp_templates_table.sql` migration
- [ ] Verify new columns exist:
  - `language`
  - `template_type`
  - `parameter_format`
  - `components`
  - `meta_status`
  - `meta_quality_score`
  - `message_send_ttl_seconds`
  - `last_synced_at`
- [ ] Verify indexes created
- [ ] Verify `active_whatsapp_templates` view exists
- [ ] Check existing data migrated correctly

### 3. Code Deployment
- [ ] All TypeScript files compile without errors
- [ ] New DTOs are properly exported
- [ ] Service methods are accessible
- [ ] Controller endpoints are registered
- [ ] No breaking changes in existing endpoints

### 4. Testing
- [ ] Unit tests pass (if applicable)
- [ ] Integration tests pass (if applicable)
- [ ] Manual testing completed:
  - [ ] Sync templates from Meta
  - [ ] List templates with filters
  - [ ] Get template by ID
  - [ ] Create new template
  - [ ] Send template message
  - [ ] Delete template

## Deployment Steps

### Step 1: Backup
```bash
# Backup database
pg_dump -U your_user your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup .env file
cp .env .env.backup
```

### Step 2: Update Environment
```bash
# Add to .env
echo "WHATSAPP_BUSINESS_ACCOUNT_ID=your_id_here" >> .env
```

### Step 3: Run Migration
```bash
# Test on staging first!
psql -U your_user -d your_staging_db -f database/migrations/update_whatsapp_templates_table.sql

# If successful, run on production
psql -U your_user -d your_production_db -f database/migrations/update_whatsapp_templates_table.sql
```

### Step 4: Deploy Code
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart application
pm2 restart your-app
# OR
systemctl restart your-service
```

### Step 5: Verify Deployment
```bash
# Check application is running
curl http://localhost:8080/health

# Sync templates
curl -X POST http://localhost:8080/messages/templates/sync \
  -H "Authorization: Bearer YOUR_TOKEN"

# List templates
curl http://localhost:8080/messages/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Post-Deployment

### 1. Verification
- [ ] Application started successfully
- [ ] No errors in logs
- [ ] Templates synced from Meta
- [ ] Can fetch templates via API
- [ ] Can send template messages
- [ ] Webhooks still working
- [ ] Existing functionality not broken

### 2. Monitoring
- [ ] Check error logs for first 24 hours
- [ ] Monitor template sync success rate
- [ ] Monitor message delivery rates
- [ ] Check quality scores
- [ ] Monitor API response times

### 3. Documentation
- [ ] Update API documentation
- [ ] Notify team of new endpoints
- [ ] Share template examples with team
- [ ] Document any custom templates created

## Rollback Plan

If issues occur:

### Step 1: Restore Database
```bash
# Stop application
pm2 stop your-app

# Restore database backup
psql -U your_user -d your_database < backup_YYYYMMDD_HHMMSS.sql

# Restore .env
cp .env.backup .env
```

### Step 2: Revert Code
```bash
# Checkout previous version
git checkout previous_commit_hash

# Rebuild
npm run build

# Restart
pm2 restart your-app
```

### Step 3: Verify Rollback
```bash
# Test basic functionality
curl http://localhost:8080/messages/templates
```

## Production Checklist

### Security
- [ ] Access tokens are not exposed in logs
- [ ] Environment variables are secure
- [ ] API endpoints require authentication
- [ ] Rate limiting is in place
- [ ] Input validation is working

### Performance
- [ ] Database indexes are optimized
- [ ] API response times are acceptable
- [ ] No N+1 query issues
- [ ] Caching is configured (if applicable)

### Monitoring
- [ ] Error tracking is set up (Sentry, etc.)
- [ ] Logging is configured
- [ ] Metrics are being collected
- [ ] Alerts are configured for failures

### Compliance
- [ ] WhatsApp Business Policy compliance verified
- [ ] User opt-in/opt-out handling in place
- [ ] Data retention policies followed
- [ ] Privacy policy updated (if needed)

## Common Issues & Solutions

### Issue: Migration Fails
**Solution:**
1. Check PostgreSQL version compatibility
2. Verify user has proper permissions
3. Check for conflicting constraints
4. Review error message in detail

### Issue: Templates Not Syncing
**Solution:**
1. Verify `WHATSAPP_BUSINESS_ACCOUNT_ID` is correct
2. Check access token permissions
3. Verify network connectivity to Meta API
4. Check Meta Business Manager for template status

### Issue: Cannot Send Templates
**Solution:**
1. Verify template status is APPROVED
2. Check parameter count matches template
3. Verify phone number format (E.164)
4. Check messaging limits not exceeded

### Issue: Performance Degradation
**Solution:**
1. Check database query performance
2. Verify indexes are being used
3. Monitor API rate limits
4. Check for memory leaks

## Support Contacts

- **Meta Support**: [WhatsApp Business Support](https://business.facebook.com/business/help)
- **Documentation**: See `WHATSAPP_TEMPLATES.md`
- **Examples**: See `WHATSAPP_TEMPLATE_EXAMPLES.md`
- **Quick Start**: See `QUICK_START_TEMPLATES.md`

## Success Criteria

Deployment is successful when:
- ✅ Application is running without errors
- ✅ Templates are syncing from Meta
- ✅ Can create new templates
- ✅ Can send template messages
- ✅ Quality scores are being tracked
- ✅ All existing functionality works
- ✅ No performance degradation
- ✅ Monitoring shows healthy metrics

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-deployment checks | 30 min | ⏳ |
| Database backup | 10 min | ⏳ |
| Migration execution | 5 min | ⏳ |
| Code deployment | 15 min | ⏳ |
| Verification | 20 min | ⏳ |
| Monitoring | 24 hours | ⏳ |

**Total estimated time: ~1.5 hours + 24h monitoring**

## Sign-off

- [ ] Database Administrator approved migration
- [ ] Backend Developer tested changes
- [ ] QA verified functionality
- [ ] DevOps reviewed deployment plan
- [ ] Product Owner approved release

---

**Date:** _____________  
**Deployed by:** _____________  
**Verified by:** _____________  

## Notes

_Add any deployment-specific notes here_

---

**Remember:** Always test on staging first! 🚀
