# Scheduler Documentation - Unifesto Backend

## Overview
Comprehensive scheduled jobs implementation for the Unifesto NestJS backend using `@nestjs/schedule`. All jobs are non-blocking, fault-tolerant, and include detailed logging.

---

## Architecture

### Schedule Module Setup
- **Module**: `@nestjs/schedule` v6.1.3 (already installed)
- **Configuration**: `ScheduleModule.forRoot()` added to `app.module.ts`
- **Job Decorators**: Using `@Cron()` with expressions and built-in constants

### Scheduler Services Created
1. **EventSchedulerService** - Event-related scheduled jobs
2. **SubscriptionSchedulerService** - Subscription lifecycle management
3. **AdminSchedulerService** - Admin reports and campaign processing

---

## Event Scheduler (`event-scheduler.service.ts`)

### Job 1: Send Event Reminders
**Frequency**: Every hour  
**Cron**: `@Cron(CronExpression.EVERY_HOUR)`  
**Finds**: Events starting in 23-25 hours  
**Actions**:
- Sends `sendEventReminder` email to all registered attendees
- Sends `sendEventReminder` WhatsApp to all registered attendees
- Includes: event details, QR code, ticket code, venue info

**Query Logic**:
```typescript
startDateTime: { gte: in23Hours, lte: in25Hours }
status: 'PUBLISHED'
isWaitlisted: false
status: { not: 'CANCELLED' }
```

**Notifications Sent**:
- Email with full event details, QR code, ticket code
- WhatsApp with event details and venue

---

### Job 2: Event Starting Soon
**Frequency**: Every 15 minutes  
**Cron**: `@Cron('*/15 * * * *')`  
**Finds**: Events starting in 55-65 minutes  
**Actions**:
- Sends `sendEventStartingSoon` email to all registered attendees
- Includes: QR code, online URL (if applicable)

**Query Logic**:
```typescript
startDateTime: { gte: in55Min, lte: in65Min }
status: 'PUBLISHED'
isWaitlisted: false
```

**Use Case**: Last-minute reminder for attendees to prepare

---

### Job 3: Mark Completed Events
**Frequency**: Every hour  
**Cron**: `@Cron(CronExpression.EVERY_HOUR)`  
**Finds**: Published events whose endDateTime has passed  
**Actions**:
- Updates event status from `PUBLISHED` to `COMPLETED`
- Batch update using `updateMany`

**Query Logic**:
```typescript
endDateTime: { lte: now }
status: 'PUBLISHED'
```

**Purpose**: Automated event lifecycle management

---

### Job 4: Send Event Summaries
**Frequency**: Every hour  
**Cron**: `@Cron(CronExpression.EVERY_HOUR)`  
**Finds**: Events that completed in last 1-2 hours  
**Actions**:
- Sends `sendEventSummary` email to attendees who checked in (status: ATTENDED)
- Includes: attendee count, coins awarded (standard 50 coins)

**Query Logic**:
```typescript
endDateTime: { gte: twoHoursAgo, lte: oneHourAgo }
status: 'COMPLETED'
registrations.status: 'ATTENDED'
```

**Purpose**: Thank attendees and confirm coin rewards

---

## Subscription Scheduler (`subscription-scheduler.service.ts`)

### Job 1: Handle Expired Subscriptions
**Frequency**: Daily at midnight  
**Cron**: `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`  
**Finds**: Active paid subscriptions that have expired  
**Actions**:
- Downgrades subscription plan to `STARTER`
- Sets `isActive: false` and `cancelledAt: now`
- Invalidates plan cache
- Sends `sendSubscriptionExpired` email
- Sends `sendSubscriptionDowngraded` email

**Query Logic**:
```typescript
expiresAt: { lte: now }
isActive: true
plan: { not: OrgPlan.STARTER }
```

**Impact**: Automatic subscription expiry and downgrade

---

### Job 2: Send Expiring Subscription Warnings
**Frequency**: Daily at 9 AM  
**Cron**: `@Cron('0 9 * * *')`  
**Finds**: Subscriptions expiring in 7 days  
**Actions**:
- Sends `sendSubscriptionExpiring` email with renewal link

**Query Logic**:
```typescript
expiresAt: { gte: in6Days, lte: in7Days }
isActive: true
plan: { not: OrgPlan.STARTER }
```

**Purpose**: Give users time to renew before expiry

---

### Job 3: Reset Monthly Event Counts
**Frequency**: 1st of every month at midnight  
**Cron**: `@Cron('0 0 1 * *')`  
**Finds**: All subscriptions  
**Actions**:
- Resets `eventsThisMonth` counter to 0
- Updates `usageResetAt` to current date

**Purpose**: Monthly usage quota reset for plan limits

---

## Admin Scheduler (`admin-scheduler.service.ts`)

### Job 1: Daily Admin Digest
**Frequency**: Daily at 8 AM  
**Cron**: `@Cron('0 8 * * *')`  
**Metrics Collected** (last 24 hours):
- New users
- New spaces
- New events
- Total registrations
- Total revenue (sum of paid razorpayAmount)
- Active users

**Actions**:
- Sends `sendDailyAdminDigest` email to `ADMIN_EMAIL` env var

**Purpose**: Daily operational overview for admins

---

### Job 2: Weekly Report
**Frequency**: Every Monday at 9 AM  
**Cron**: `@Cron('0 9 * * 1')`  
**Metrics Collected** (last 7 days):
- Total users (all time) + new users this week
- Total active events + new events this week
- Total registrations this week
- Total revenue this week

**Actions**:
- Sends `sendWeeklyReport` email to admin with comparative metrics

**Purpose**: Week-over-week growth tracking

---

### Job 3: Monthly Invoice Summary
**Frequency**: 1st of every month at 7 AM  
**Cron**: `@Cron('0 7 1 * *')`  
**Metrics Collected** (previous month):
- Total revenue (sum of paid registrations)
- Total transaction count
- Top 5 events by registration count

**Actions**:
- Sends `sendMonthlyInvoiceSummary` email to admin

**Purpose**: Monthly financial reporting

---

### Job 4: Process Scheduled Email Campaigns
**Frequency**: Every 10 minutes  
**Cron**: `@Cron('*/10 * * * *')`  
**Finds**: Email campaigns with status `SCHEDULED` and scheduledAt ≤ now  
**Actions**:
- Processes up to 5 campaigns per run
- Triggers `adminEmailService.processCampaignById()` for each

**Query Logic**:
```typescript
status: 'SCHEDULED'
scheduledAt: { lte: now }
take: 5
```

**Purpose**: Automated bulk email campaign sending

---

## Cron Schedule Reference

| Job | Schedule | Cron Expression | Description |
|-----|----------|-----------------|-------------|
| Event Reminders | Every hour | `@Cron(CronExpression.EVERY_HOUR)` | 24h before event |
| Event Starting Soon | Every 15 min | `@Cron('*/15 * * * *')` | 1h before event |
| Mark Completed Events | Every hour | `@Cron(CronExpression.EVERY_HOUR)` | Status update |
| Event Summaries | Every hour | `@Cron(CronExpression.EVERY_HOUR)` | Post-event emails |
| Expired Subscriptions | Daily 12:00 AM | `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` | Downgrade expired |
| Expiring Warnings | Daily 9:00 AM | `@Cron('0 9 * * *')` | 7 days before expiry |
| Reset Event Counts | 1st of month 12:00 AM | `@Cron('0 0 1 * *')` | Monthly reset |
| Daily Admin Digest | Daily 8:00 AM | `@Cron('0 8 * * *')` | Yesterday's metrics |
| Weekly Report | Monday 9:00 AM | `@Cron('0 9 * * 1')` | Weekly summary |
| Monthly Invoice | 1st of month 7:00 AM | `@Cron('0 7 1 * *')` | Last month's revenue |
| Process Campaigns | Every 10 min | `@Cron('*/10 * * * *')` | Scheduled campaigns |

---

## Error Handling

### Non-Blocking Design
All email/WhatsApp calls use `.catch()` to prevent one failure from stopping the batch:

```typescript
this.emailService.sendEventReminder({...})
  .catch(err => this.logger.error('Event reminder email failed', err));
```

### Logging Strategy
- **Start**: Log when job begins
- **Progress**: Log for each entity processed
- **Completion**: Log summary (count of items processed)
- **Errors**: Log individual failures without breaking loop

### Example Log Output
```
[EventSchedulerService] Starting event reminder job...
[EventSchedulerService] Sent reminders for event abc-123 to 150 attendees
[EventSchedulerService] Event reminder job completed. Processed 3 events
```

---

## Idempotency Considerations

### Built-in Idempotency
- **Time Windows**: Jobs use date ranges to avoid duplicate processing
  - Example: Events starting in 23-25 hours (1-hour overlap acceptable)
  - Example: Events completed 1-2 hours ago (no overlap on subsequent runs)

### Manual Idempotency (if needed)
For critical operations, add Redis-based idempotency:
```typescript
const key = `job:event-reminder:${eventId}`;
const exists = await this.cache.get(key);
if (exists) return; // already processed

// Process...

await this.cache.set(key, '1', 3600); // 1 hour TTL
```

---

## Configuration

### Environment Variables
- `ADMIN_EMAIL`: Admin email for digest/reports (default: `aws@unifesto.app`)

### Timezone
All date/time formatting uses `Asia/Kolkata` timezone:
```typescript
private formatDate(dateTime: Date, timezone = 'Asia/Kolkata'): string
```

### Date Format Outputs
- **Date**: "7 June 2026"
- **Time**: "10:00 AM - 1:00 PM IST"

---

## Testing Scheduled Jobs

### Manual Trigger (Development)
You can manually trigger jobs via NestJS CLI or by temporarily changing cron:

```typescript
// Change to run every minute for testing
@Cron('* * * * *')
async sendEventReminders() { ... }
```

### Test-Specific Dates
Create test events with specific dates:
```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

// Create event starting in 24 hours
await prisma.event.create({
  data: {
    startDateTime: tomorrow,
    // ...
  }
});
```

### Check Logs
Monitor scheduler logs in development:
```bash
npm run start:dev

# Watch for scheduler logs
[EventSchedulerService] Starting event reminder job...
```

---

## Module Configuration

### Updated Modules
1. **events.module.ts**
   - Added `EventSchedulerService` to providers
   - Added `WhatsAppModule` to imports

2. **subscription.module.ts**
   - Added `SubscriptionSchedulerService` to providers

3. **admin.module.ts**
   - Added `AdminSchedulerService` to providers

4. **app.module.ts**
   - Added `ScheduleModule.forRoot()` to imports

---

## Performance Considerations

### Batch Processing
- Process items in loops to avoid loading everything in memory
- Use `findMany` with pagination if dealing with thousands of records

### Database Query Optimization
- Use `select` to fetch only required fields
- Use `include` strategically to reduce N+1 queries
- Use aggregations (`_sum`, `_count`) for metrics

### Rate Limiting
- Campaign processor: max 5 campaigns per run (every 10 min)
- Consider adding delays between bulk operations if needed

---

## Monitoring Recommendations

### Metrics to Track
- Job execution duration
- Job success/failure rate
- Number of emails sent per job
- Number of errors per job

### Alerting Triggers
- Job fails consecutively (3+ times)
- Job duration exceeds threshold (e.g., >5 minutes)
- Zero emails sent when data exists
- High error rate (>10% of emails fail)

### Log Aggregation
Use log management tools (CloudWatch, Datadog, etc.) to:
- Search for `[SchedulerService]` logs
- Filter by error level
- Create dashboards for job metrics

---

## Deployment Notes

### Horizontal Scaling
⚠️ **Important**: When running multiple instances, schedulers will execute on all instances.

**Solutions**:
1. **Leader Election**: Use Redis-based leader election
2. **Single Instance**: Run schedulers only on one instance
3. **Distributed Locks**: Use Redis locks to prevent duplicate execution

### Graceful Shutdown
Jobs in progress will complete before shutdown. NestJS Schedule handles this automatically.

### Time Zone Consistency
Ensure all server instances use the same timezone or UTC for consistency.

---

## Future Enhancements

### Potential Additions
1. **Retry Logic**: Add exponential backoff for failed emails
2. **Dead Letter Queue**: Store failed notifications for manual review
3. **Dynamic Scheduling**: Allow admins to configure job schedules
4. **Job Dashboard**: UI to view job status and history
5. **A/B Testing**: Test different email send times for optimal engagement

---

## Files Created

1. `src/events/event-scheduler.service.ts` (313 lines)
2. `src/subscription/subscription-scheduler.service.ts` (172 lines)
3. `src/admin/admin-scheduler.service.ts` (229 lines)

## Files Updated

1. `src/app.module.ts` - Added ScheduleModule.forRoot()
2. `src/events/events.module.ts` - Added EventSchedulerService, WhatsAppModule
3. `src/subscription/subscription.module.ts` - Added SubscriptionSchedulerService
4. `src/admin/admin.module.ts` - Added AdminSchedulerService

---

**Status**: ✅ Complete  
**Total Jobs**: 11 scheduled jobs  
**Total Services**: 3 scheduler services  
**Date**: 2026-06-07
