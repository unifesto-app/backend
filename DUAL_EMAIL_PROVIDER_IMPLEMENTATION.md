# Dual Email Provider Implementation Guide

## Status: Phase 1 Complete ✅

### Completed
- ✅ Installed @aws-sdk/client-ses
- ✅ Updated Prisma schema with EmailCampaign and EmailCampaignLog models
- ✅ Added 3 new enums: EmailTargetType, EmailCampaignStatus, EmailLogStatus
- ✅ Created migration file: `20260607000000_add_email_campaigns`

---

## Phase 2: Update Email Service with Dual Provider

### File: `src/email/email.service.ts`

Due to the massive size (55 total email methods), I recommend implementing this in stages:

**Stage 1: Add Dual Provider Infrastructure** (Priority: HIGH)
- Import AWS SES SDK
- Add SES client initialization
- Create `sendViaResend()` private method
- Create `sendViaSES()` private method
- Update all existing 11 methods to use `sendViaResend()`

**Stage 2: Add Auth & Account Emails** (7 methods)
- sendPasswordlessLoginLink
- sendAccountDeactivated
- sendEmailVerification
- sendAccountSuspended
- sendAccountReactivated
- sendNewDeviceLogin
- sendSuspiciousActivity

**Stage 3: Add Event Emails** (9 methods)
- sendEventCancelled
- sendEventUpdated
- sendEventPublished
- sendWaitlistConfirmation
- sendWaitlistPromoted
- sendEventSummary
- sendEventStartingSoon
- sendSpeakerInvitation

**Stage 4: Add Space Emails** (8 methods)
- sendSpaceMemberJoined
- sendCoOrganizerInvited
- sendCoOrganizerRemoved
- sendParentSpaceRequestSubmitted
- sendParentSpaceRequestApproved
- sendParentSpaceRequestRejected
- sendSpaceSuspended
- sendSpaceArchived

**Stage 5: Add Wallet & Payment Emails** (6 methods)
- sendPaymentFailed
- sendRedeemCodeUsed
- sendAdminCoinGrant
- sendPartnerCoinCredit
- sendLowBalanceAlert
- sendRefundProcessed

**Stage 6: Add Subscription Emails** (7 methods)
- sendSubscriptionActivated
- sendSubscriptionCancelled
- sendSubscriptionExpiring
- sendSubscriptionExpired
- sendSubscriptionUpgraded
- sendSubscriptionDowngraded
- sendInvoice

**Stage 7: Add Referral & Admin Emails** (6 methods)
- sendReferralCodeReminder
- sendReferralMilestone
- sendDailyAdminDigest (uses SES)
- sendWeeklyReport (uses SES)
- sendMonthlyInvoiceSummary (uses SES)
- sendCustomCampaignEmail (uses SES)

---

## Phase 3: Admin Email Service

### File: `src/admin/admin-email.service.ts`

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { EmailCampaignStatus, EmailLogStatus, EmailTargetType } from '@prisma/client';

interface SendToUserDto {
  userId: string;
  subject: string;
  body: string;
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
  filters: {
    city?: string[];
    plan?: string[];
    joinedAfter?: string;
    joinedBefore?: string;
    hasWallet?: boolean;
    minCoins?: number;
    hasRegistrations?: boolean;
    isOnboarded?: boolean;
  };
  scheduledAt?: Date;
}

@Injectable()
export class AdminEmailService {
  private readonly logger = new Logger(AdminEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async sendToUser(adminId: string, dto: SendToUserDto) {
    // Implementation
  }

  async sendToSpace(adminId: string, dto: SendToSpaceDto) {
    // Implementation
  }

  async sendToEvent(adminId: string, dto: SendToEventDto) {
    // Implementation
  }

  async sendToAll(adminId: string, dto: SendToAllDto) {
    // Implementation
  }

  async sendToOrganisers(adminId: string, dto: { subject: string; body: string; scheduledAt?: Date }) {
    // Implementation
  }

  async sendToWaitlist(adminId: string, dto: { eventId: string; subject: string; body: string; scheduledAt?: Date }) {
    // Implementation
  }

  async sendToSegment(adminId: string, dto: SendToSegmentDto) {
    // Implementation
  }

  async getCampaigns(page: number, limit: number) {
    // Implementation
  }

  async getCampaignById(id: string) {
    // Implementation
  }

  async cancelCampaign(id: string) {
    // Implementation
  }

  // Background processing
  private async processCampaign(campaignId: string): Promise<void> {
    // Get campaign
    // Get recipients
    // Send in batches of 100
    // Log each send
  }

  private async getRecipients(campaign: any): Promise<{ email: string; userId?: string }[]> {
    // Based on targetType, query appropriate table
  }

  private async sendBatch(campaign: any, batch: { email: string; userId?: string }[]): Promise<void> {
    // Use emailService.sendCustomCampaignEmail
    // Log results in EmailCampaignLog
  }
}
```

---

## Phase 4: Admin Email Controller

### File: `src/admin/admin-email.controller.ts`

```typescript
import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdminEmailService } from './admin-email.service';

@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminEmailController {
  constructor(private readonly adminEmailService: AdminEmailService) {}

  @Post('send-to-user')
  async sendToUser(@GetUser('id') adminId: string, @Body() dto: any) {
    return this.adminEmailService.sendToUser(adminId, dto);
  }

  @Post('send-to-space')
  async sendToSpace(@GetUser('id') adminId: string, @Body() dto: any) {
    return this.adminEmailService.sendToSpace(adminId, dto);
  }

  @Post('send-to-event')
  async sendToEvent(@GetUser('id') adminId: string, @Body() dto: any) {
    return this.adminEmailService.sendToEvent(adminId, dto);
  }

  @Post('send-to-all')
  async sendToAll(@GetUser('id') adminId: string, @Body() dto: any) {
    return this.adminEmailService.sendToAll(adminId, dto);
  }

  @Post('send-to-organisers')
  async sendToOrganisers(@GetUser('id') adminId: string, @Body() dto: any) {
    return this.adminEmailService.sendToOrganisers(adminId, dto);
  }

  @Post('send-to-waitlist')
  async sendToWaitlist(@GetUser('id') adminId: string, @Body() dto: any) {
    return this.adminEmailService.sendToWaitlist(adminId, dto);
  }

  @Post('send-to-segment')
  async sendToSegment(@GetUser('id') adminId: string, @Body() dto: any) {
    return this.adminEmailService.sendToSegment(adminId, dto);
  }

  @Get('campaigns')
  async getCampaigns(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.adminEmailService.getCampaigns(page, limit);
  }

  @Get('campaigns/:id')
  async getCampaignById(@Param('id') id: string) {
    return this.adminEmailService.getCampaignById(id);
  }

  @Delete('campaigns/:id')
  async cancelCampaign(@Param('id') id: string) {
    return this.adminEmailService.cancelCampaign(id);
  }
}
```

---

## Phase 5: Update Admin Module

### File: `src/admin/admin.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEmailController } from './admin-email.controller';
import { AdminEmailService } from './admin-email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, AuthModule, EmailModule],
  controllers: [AdminController, AdminEmailController],
  providers: [AdminService, AdminEmailService],
  exports: [AdminService, AdminEmailService],
})
export class AdminModule {}
```

---

## Environment Variables Required

Add to `.env`:

```env
# Resend (transactional)
RESEND_API_KEY=re_xxx
EMAIL_FROM_TRANSACTIONAL=no-reply@notify.unifesto.app

# AWS SES (bulk)
AWS_SES_REGION=ap-south-1
EMAIL_FROM_BULK=no-reply@updates.unifesto.app

# Admin
ADMIN_EMAIL=aws@unifesto.app
```

---

## Dependencies Installed

✅ `@aws-sdk/client-ses` - Already installed

---

## Next Steps

**Option 1: Implement Stage by Stage** (Recommended)
I can implement each stage sequentially, testing as we go.

**Option 2: Complete Implementation**
I can provide the complete updated email.service.ts with all 55 methods, but it will be very large.

**Option 3: Focus on Specific Category**
Choose one category (Auth, Events, Spaces, etc.) to implement first.

**Which approach would you like me to take?**
