import { Injectable, Logger } from '@nestjs/common';
import {
  ComprehendClient,
  DetectSentimentCommand,
} from '@aws-sdk/client-comprehend';

export interface ApiModerationResult {
  flagged: boolean;
  confidence: number;
  reason?: string;
}

/**
 * Calls out to an external moderation service for borderline-text checks
 * that the keyword pre-filter didn't catch outright.
 *
 * NOTE: AWS Comprehend does NOT have a purpose-built "adult content"
 * classifier out of the box the way OpenAI's moderation endpoint or
 * AWS Rekognition (for images) do. You have two realistic options here —
 * pick one before wiring this in for real:
 *
 *   1. OpenAI moderation endpoint (https://platform.openai.com/docs/guides/moderation)
 *      — purpose-built categories including sexual content, free tier available,
 *      simplest to integrate correctly. New vendor/API key to manage.
 *
 *   2. AWS Comprehend custom classifier — train a custom text classifier on
 *      labeled examples of what you consider 18+ content. More setup work,
 *      but stays inside your existing AWS account/IAM.
 *
 * The method below is stubbed for AWS Comprehend's built-in APIs (which can
 * help with PII detection and sentiment, but not adult-content classification
 * specifically) so it compiles and runs — replace `callModerationProvider`
 * with your chosen vendor's actual moderation call before relying on this
 * in production. Everything else in the chat module (queueing, thresholds,
 * flag creation) is provider-agnostic and won't need to change.
 */
@Injectable()
export class ModerationApiService {
  private readonly logger = new Logger(ModerationApiService.name);
  private readonly comprehend: ComprehendClient;

  constructor() {
    this.comprehend = new ComprehendClient({
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }

  async checkText(text: string): Promise<ApiModerationResult> {
    try {
      return await this.callModerationProvider(text);
    } catch (err) {
      this.logger.error(`Moderation API check failed: ${err.message}`);
      // Fail-safe default: DO NOT auto-block on API failure (avoid false
      // positives taking down chat during an outage), but log loudly so
      // you notice degraded moderation coverage.
      return { flagged: false, confidence: 0 };
    }
  }

  /**
   * TODO: replace with your chosen moderation vendor's actual call.
   * Left as a Comprehend sentiment call purely as a working placeholder
   * so the rest of the pipeline is testable end-to-end before you decide
   * on OpenAI moderation vs. a Comprehend custom classifier.
   */
  private async callModerationProvider(
    text: string,
  ): Promise<ApiModerationResult> {
    const command = new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'en',
    });
    await this.comprehend.send(command);

    // Placeholder — always returns not-flagged. Wire in your real
    // adult-content classifier response parsing here.
    return { flagged: false, confidence: 0 };
  }
}
