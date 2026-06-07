# Unifesto Email System Expansion Specification

## Overview
This spec outlines the expansion of the Unifesto email system to include:
- Admin custom email campaigns
- Additional transactional emails (50+ templates)
- Scheduled email jobs
- Email campaign tracking and analytics

---

## Phase 1: Database Schema & Admin Campaign Infrastructure

### 1.1 Prisma Schema Updates

**File**: `prisma/schema.prisma`

```prisma
// Email Campaign Models
model EmailCampaign {
  id          String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  subject     String              @db.VarChar(500)
  body        String              @db.Text // HTML content
  
  // Admin who sent
  sentBy      String              @map("sent_by") @db.Uuid
  sentByUser  User                @relation("EmailCampaignsSent", fields: [sentBy], references: [id])
  
  // Target configuration
  targetType  EmailTargetType     @map("target_type")
  targetId    String?             @map("target_id") @db.Uuid // spaceId, eventId, userId
  
  // Segment filters (JSON for flexibility)
  segmentFilters Json?             @map("segment_filters")
  
  // Tracking
  totalSent   Int                 @default(0) @map("total_sent")
  failedCount Int                 @default(0) @map("failed_count")
  status      EmailCampaignStatus @default(PENDING)
  
  // Scheduling
  scheduledAt DateTime?           @map("scheduled_at") @db.Timestamptz(6)
  sentAt      DateTime?           @map("sent_at") @db.Timestamptz(6)
  
  createdAt   DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  // Relations
  logs EmailCampaignLog[]
  
  @@index([sentBy])
  @@index([targetType])
  @@index([status])
  @@index([scheduledAt])
  @@map("email_campaigns")
}

model EmailCampaignLog {
  id         String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  campaignId String        @map("campaign_id") @db.Uuid
  campaign   EmailCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  recipientEmail String     @map("recipient_email") @db.VarChar(255)
  userId         String?    @map("user_id") @db.Uuid
  
  status         EmailLogStatus
  errorMessage   String?    @map("error_message") @db.Text
  resendId       String?    @map("resend_id") @db.VarChar(255)
  
  sentAt     DateTime   @default(now()) @map("sent_at") @db.Timestamptz(6)
  
  @@index([campaignId])
  @@index([userId])
  @@index([status])
  @@map("email_campaign_logs")
}

enum EmailTargetType {
  SINGLE_USER
  SPACE_MEMBERS
  EVENT_REGISTRANTS
  ALL_USERS
  ORGANISERS_ONLY
  WAITLIST
  SEGMENT
  
  @@map("email_target_type")
}

enum EmailCampaignStatus {
  PENDING
  SENDING
  SENT
  FAILED
  SCHEDULED
  CANCELLED
  
  @@map("email_campaign_status")
}

enum EmailLogStatus {
  SENT
  FAILED
  BOUNCED
  
  @@map("email_log_status")
}

// Add to User model
model User {
  // ... existing fields
  emailCampaignsSent EmailCampaign[] @relation("EmailCampaignsSent")
}
```

**Segment Filters Schema** (stored as JSON):
```typescript
interface SegmentFilters {
  city?: string[];
  plan?: OrgPlan[];
  joinedAfter?: string;   // ISO date
  joinedBefore?: string;  // ISO date
  hasWallet?: boolean;
  minCoins?: number;
  hasRegistrations?: boolean;
  isOnboarded?: boolean;
}
```

---

## Phase 2: Admin Email Campaign Service

### 2.1 Admin Email Service

**File**: `src/admin/admin-email.service.ts`

**Methods**:
```typescript
class AdminEmailService {
  // Custom campaigns
  async sendCustomEmailToUser(adminId: string, dto: SendToUserDto): Promise<EmailCampaign>
  async sendCustomEmailToSpace(adminId: string, dto: SendToSpaceDto): Promise<EmailCampaign>
  async sendCustomEmailToEvent(adminId: string, dto: SendToEventDto): Promise<EmailCampaign>
  async sendCustomEmailToAllUsers(adminId: string, dto: SendToAllDto): Promise<EmailCampaign>
  async sendCustomEmailToOrganisers(adminId: string, dto: SendToOrganisersDto): Promise<EmailCampaign>
  async sendCustomEmailToWaitlist(adminId: string, dto: SendToWaitlistDto): Promise<EmailCampaign>
  async sendCustomEmailToSegment(adminId: string, dto: SendToSegmentDto): Promise<EmailCampaign>
  
  // Campaign management
  async scheduleCampaign(adminId: string, dto: ScheduleCampaignDto): Promise<EmailCampaign>
  async getCampaigns(page: number, limit: number): Promise<PaginatedResponse<EmailCampaign>>
  async getCampaignById(campaignId: string): Promise<EmailCampaignDetails>
  async cancelCampaign(campaignId: string): Promise<EmailCampaign>
  
  // Background processing
  async processCampaign(campaignId: string): Promise<void>
  private async getRecipients(campaign: EmailCampaign): Promise<EmailRecipient[]>
  private async sendBatch(campaign: EmailCampaign, recipients: EmailRecipient[]): Promise<void>
}
```

**DTOs**:
```typescript
interface SendToUserDto {
  userId: string;
  subject: string;
  body: string; // HTML
  scheduledAt?: Date;
}

interface SendToSpaceDto {
  spaceId: string;
  subject: string;
  body: string;
  scheduledAt?: Date;
}

interface SendToEventDto {
  eventId: string;
  subject: string;
  body: string;
  includeWaitlist?: boolean;
  scheduledAt?: Date;
}

interface SendToAllDto {
  subject: string;
  body: string;
  scheduledAt?: Date;
}

interface SendToSegmentDto {
  subject: string;
  body: string;
  filters: SegmentFilters;
  scheduledAt?: Date;
}
```

---

## Phase 3: Admin Email Controller

### 3.1 Admin Email Endpoints

**File**: `src/admin/admin-email.controller.ts`

```typescript
@Controller('admin/email')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminEmailController {
  @Post('send-to-user')
  async sendToUser(@GetUser() admin, @Body() dto: SendToUserDto)
  
  @Post('send-to-space')
  async sendToSpace(@GetUser() admin, @Body() dto: SendToSpaceDto)
  
  @Post('send-to-event')
  async sendToEvent(@GetUser() admin, @Body() dto: SendToEventDto)
  
  @Post('send-to-all')
  async sendToAll(@GetUser() admin, @Body() dto: SendToAllDto)
  
  @Post('send-to-organisers')
  async sendToOrganisers(@GetUser() admin, @Body() dto: SendToOrganisersDto)
  
  @Post('send-to-waitlist')
  async sendToWaitlist(@GetUser() admin, @Body() dto: SendToWaitlistDto)
  
  @Post('send-to-segment')
  async sendToSegment(@GetUser() admin, @Body() dto: SendToSegmentDto)
  
  @Post('schedule')
  async scheduleCampaign(@GetUser() admin, @Body() dto: ScheduleCampaignDto)
  
  @Get('campaigns')
  async getCampaigns(@Query() query: PaginationDto)
  
  @Get('campaigns/:id')
  async getCampaignDetails(@Param('id') id: string)
  
  @Delete('campaigns/:id')
  async cancelCampaign(@Param('id') id: string)
  
  @Get('campaigns/:id/preview')
  async previewRecipients(@Param('id') id: string)
}
```

---

## Phase 4: Additional Transactional Email Templates

### 4.1 Auth & Accounts (7 templates)

**Methods**:
```typescript
sendPasswordlessLoginLink(data: PasswordlessLinkData)
sendAccountDeactivated(data: AccountStatusData)
sendEmailVerification(data: EmailVerificationData)
sendAccountSuspended(data: AccountStatusData)
sendAccountReactivated(data: AccountStatusData)
sendNewDeviceLogin(data: NewDeviceData)
sendSuspiciousActivity(data: SuspiciousActivityData)
```

### 4.2 Events (9 templates)

**Methods**:
```typescript
sendEventCancelled(data: EventCancelledData)
sendEventUpdated(data: EventUpdatedData)
sendEventPublished(data: EventPublishedData)
sendWaitlistConfirmation(data: WaitlistData)
sendWaitlistPromoted(data: WaitlistPromotedData)
sendEventSummary(data: EventSummaryData)
sendEventStartingSoon(data: EventStartingSoonData)
sendSpeakerInvitation(data: SpeakerInviteData)
```

### 4.3 Spaces (8 templates)

**Methods**:
```typescript
sendSpaceMemberJoined(data: MemberJoinedData)
sendCoOrganizerInvited(data: CoOrganizerData)
sendCoOrganizerRemoved(data: CoOrganizerData)
sendParentSpaceRequestSubmitted(data: ParentRequestData)
sendParentSpaceRequestApproved(data: ParentRequestData)
sendParentSpaceRequestRejected(data: ParentRequestData)
sendSpaceSuspended(data: SpaceSuspendedData)
sendSpaceArchived(data: SpaceArchivedData)
```

### 4.4 Wallet & Payments (7 templates)

**Methods**:
```typescript
sendPaymentFailed(data: PaymentFailedData)
sendRedeemCodeUsed(data: RedeemCodeData)
sendAdminCoinGrant(data: CoinGrantData)
sendPartnerCoinCredit(data: PartnerCreditData)
sendLowBalanceAlert(data: LowBalanceData)
sendRefundProcessed(data: RefundData)
```

### 4.5 Subscriptions (8 templates)

**Methods**:
```typescript
sendSubscriptionActivated(data: SubscriptionData)
sendSubscriptionCancelled(data: SubscriptionData)
sendSubscriptionExpiring(data: SubscriptionExpiringData)
sendSubscriptionExpired(data: SubscriptionData)
sendSubscriptionUpgraded(data: SubscriptionChangeData)
sendSubscriptionDowngraded(data: SubscriptionChangeData)
sendInvoice(data: InvoiceData)
```

### 4.6 Referrals (2 templates)

**Methods**:
```typescript
sendReferralCodeShared(data: ReferralReminderData)
sendReferralMilestone(data: ReferralMilestoneData)
```

### 4.7 Admin Digests (3 scheduled templates)

**Methods**:
```typescript
sendDailyAdminDigest(data: DailyDigestData)
sendWeeklyReport(data: WeeklyReportData)
sendMonthlyInvoiceSummary(data: MonthlyInvoiceData)
```

**Total New Templates**: 44 methods

---

## Phase 5: Scheduled Email Jobs

### 5.1 Cron Jobs Setup

**File**: `src/email/email-scheduler.service.ts`

```typescript
@Injectable()
export class EmailSchedulerService {
  @Cron('0 9 * * *') // Daily at 9 AM
  async sendDailyDigests()
  
  @Cron('0 9 * * 1') // Weekly on Monday at 9 AM
  async sendWeeklyReports()
  
  @Cron('0 0 1 * *') // Monthly on 1st at midnight
  async sendMonthlyInvoices()
  
  @Cron('0 * * * *') // Every hour
  async sendEventReminders()
  
  @Cron('*/10 * * * *') // Every 10 minutes
  async processScheduledCampaigns()
  
  @Cron('0 0 * * *') // Daily at midnight
  async sendSubscriptionExpiring()
}
```

**Dependencies**: `@nestjs/schedule`

```bash
npm install @nestjs/schedule
```

---

## Phase 6: Email Template System

### 6.1 Template Builder Helpers

**File**: `src/email/email-template-builder.ts`

```typescript
class EmailTemplateBuilder {
  // Reusable sections
  buildTable(rows: TableRow[]): string
  buildFeatureList(features: Feature[]): string
  buildStatCard(label: string, value: string, icon?: string): string
  buildAlertBox(type: 'info' | 'warning' | 'success', content: string): string
  buildTimeline(events: TimelineEvent[]): string
  
  // Layout helpers
  twoColumnLayout(left: string, right: string): string
  threeColumnLayout(columns: string[]): string
}
```

---

## Implementation Priority

### Priority 1: Foundation (Week 1)
- ✅ Phase 1: Database schema
- ✅ Phase 2: Admin email service structure
- ✅ Phase 3: Admin email controller

### Priority 2: Core Templates (Week 2)
- Phase 4.1: Auth & Accounts (7 templates)
- Phase 4.2: Events (9 templates)

### Priority 3: Extended Templates (Week 3)
- Phase 4.3: Spaces (8 templates)
- Phase 4.4: Wallet & Payments (7 templates)

### Priority 4: Subscriptions & Jobs (Week 4)
- Phase 4.5: Subscriptions (8 templates)
- Phase 4.6: Referrals (2 templates)
- Phase 5: Scheduled jobs

### Priority 5: Admin Digests (Week 5)
- Phase 4.7: Admin digests (3 templates)
- Phase 6: Template builder utilities

---

## Testing Strategy

### Unit Tests
- Email template rendering
- Recipient list generation
- Segmentation logic

### Integration Tests
- Campaign creation flow
- Email sending with Resend
- Scheduled job execution

### Manual Testing Checklist
- [ ] Send to single user
- [ ] Send to space members
- [ ] Send to event registrants
- [ ] Send to all users (test with small subset)
- [ ] Send to organisers only
- [ ] Send to waitlist
- [ ] Send to segment (various filters)
- [ ] Schedule campaign
- [ ] Cancel scheduled campaign
- [ ] View campaign stats

---

## Security Considerations

1. **Rate Limiting**: Limit bulk email sends per admin per hour
2. **Approval Workflow**: Require super admin approval for ALL_USERS campaigns
3. **Preview Recipients**: Show recipient count before sending
4. **Unsubscribe**: Add unsubscribe link to all marketing emails
5. **Audit Log**: Track all admin email actions

---

## Performance Optimization

1. **Batch Processing**: Process campaigns in batches of 100 emails
2. **Queue System**: Use Bull/BullMQ for background processing
3. **Rate Limiting**: Respect Resend API rate limits
4. **Caching**: Cache recipient lists for large campaigns
5. **Monitoring**: Track email delivery rates and failures

---

## Cost Estimation

**Resend Pricing** (as of 2024):
- Free tier: 3,000 emails/month
- Pro: $20/month for 50,000 emails
- Growth: $80/month for 500,000 emails

**Estimated Monthly Volume**:
- Transactional: 10,000 emails
- Admin campaigns: 5,000 emails
- Scheduled digests: 1,000 emails
- **Total**: ~16,000 emails/month

**Recommended Plan**: Pro ($20/month)

---

## Dependencies to Install

```bash
npm install @nestjs/schedule
npm install @nestjs/bull bull
npm install date-fns
```

---

## Next Steps

**To proceed with implementation:**

1. Review this spec and confirm the approach
2. Choose which phase to start with (recommend: Phase 1)
3. I'll implement the chosen phase with all necessary code
4. Test and iterate
5. Move to next phase

**Would you like me to**:
- [ ] Start with Phase 1 (Database schema + Admin service foundation)?
- [ ] Focus on specific email templates first?
- [ ] Create a different implementation order?
- [ ] Add/modify any requirements?

Let me know your preference and I'll proceed with the implementation!
