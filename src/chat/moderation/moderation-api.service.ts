import { Injectable, Logger } from '@nestjs/common';

export interface ApiModerationResult {
  flagged: boolean;
  confidence: number;
  reason?: string;
}

/**
 * Calls OpenAI's moderation endpoint for borderline-text checks that the
 * keyword pre-filter didn't catch outright. Free to use, purpose-built
 * categories including "sexual" and "sexual/minors".
 * Docs: https://platform.openai.com/docs/guides/moderation
 */
@Injectable()
export class ModerationApiService {
  private readonly logger = new Logger(ModerationApiService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;

  async checkText(text: string): Promise<ApiModerationResult> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — skipping API moderation check.');
      return { flagged: false, confidence: 0 };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: text }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI moderation API returned ${response.status}`);
      }

      const data = await response.json();
      const result = data.results?.[0];
      if (!result) {
        return { flagged: false, confidence: 0 };
      }

      // Focus on the categories relevant to "no 18+ content" — sexual content
      // and sexual content involving minors (the latter always treated as
      // flagged regardless of score, given the severity).
      const sexualScore = result.category_scores?.sexual ?? 0;
      const sexualMinorsFlag = result.categories?.['sexual/minors'] ?? false;
      const sexualFlag = result.categories?.sexual ?? false;

      if (sexualMinorsFlag) {
        return { flagged: true, confidence: 1, reason: 'sexual/minors' };
      }
      if (sexualFlag) {
        return { flagged: true, confidence: sexualScore, reason: 'sexual' };
      }

      return { flagged: false, confidence: sexualScore };
    } catch (err) {
      this.logger.error(`Moderation API check failed: ${err.message}`);
      // Fail-safe default: don't auto-block on API failure (avoid false
      // positives during an outage), but log loudly.
      return { flagged: false, confidence: 0 };
    }
  }
}
