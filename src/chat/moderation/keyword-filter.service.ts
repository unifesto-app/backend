import { Injectable } from '@nestjs/common';
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

export interface KeywordMatchResult {
  matched: boolean;
  matchedTerm?: string;
}

/**
 * Uses `obscenity` (npm) — a maintained profanity/explicit-content detection
 * library with a curated English dataset and built-in transformers that
 * catch common obfuscation tricks (leetspeak, spacing, repeated chars).
 *
 * This replaces a hand-maintained wordlist: obscenity's dataset covers
 * general profanity broadly. For content specifically flagged as adult/18+
 * (as opposed to general profanity), extend englishDataset with your own
 * custom terms via .addPhrase() — see obscenity's docs for the builder API:
 * https://www.npmjs.com/package/obscenity
 */
@Injectable()
export class KeywordFilterService {
  private readonly matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

  check(text: string): KeywordMatchResult {
    const matches = this.matcher.getAllMatches(text);
    if (matches.length === 0) {
      return { matched: false };
    }
    return { matched: true, matchedTerm: `term_id:${matches[0].termId}` };
  }

  isBorderlineCandidate(text: string): boolean {
    if (text.length < 3) return false;
    const suspiciousPatterns = [/\b\d{1,2}\s*(yo|y\/o|years? old)\b/i];
    return suspiciousPatterns.some((p) => p.test(text));
  }
}
