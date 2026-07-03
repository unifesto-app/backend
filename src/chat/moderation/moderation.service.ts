import { Injectable } from '@nestjs/common';
import { KeywordFilterService } from './keyword-filter.service';
import { ModerationApiService } from './moderation-api.service';
import { ModerationFlagReason } from '@prisma/client';

export interface ModerationResult {
  blocked: boolean;
  reason?: ModerationFlagReason;
  matchedTerm?: string;
  confidence?: number;
}

@Injectable()
export class ModerationService {
  constructor(
    private readonly keywordFilter: KeywordFilterService,
    private readonly moderationApi: ModerationApiService,
  ) {}

  async checkText(text: string): Promise<ModerationResult> {
    // 1. Fast in-process keyword check first — catches obvious cases for free.
    const keywordResult = this.keywordFilter.check(text);
    if (keywordResult.matched) {
      return {
        blocked: true,
        reason: ModerationFlagReason.KEYWORD_MATCH,
        matchedTerm: keywordResult.matchedTerm,
      };
    }

    // 2. Only call the paid API for messages that look borderline —
    //    keeps cost down instead of hitting the API on every message.
    if (this.keywordFilter.isBorderlineCandidate(text)) {
      const apiResult = await this.moderationApi.checkText(text);
      if (apiResult.flagged) {
        return {
          blocked: true,
          reason: ModerationFlagReason.API_FLAGGED,
          confidence: apiResult.confidence,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * For image messages — call this after upload to S3, before marking the
   * message VISIBLE. Wire to AWS Rekognition's DetectModerationLabels API
   * (same AWS account as your existing StorageService, region ap-south-1).
   */
  async checkImage(s3Key: string): Promise<ModerationResult> {
    // TODO: call Rekognition DetectModerationLabels against the S3 object.
    // Left unimplemented here since it depends on your StorageService's
    // exact bucket/key conventions — plug in during the image-upload step.
    return { blocked: false };
  }
}
