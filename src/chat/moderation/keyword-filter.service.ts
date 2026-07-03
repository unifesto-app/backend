import { Injectable } from '@nestjs/common';
import { WORD_BOUNDARY_TERMS, SUBSTRING_TERMS } from './keyword-list';

export interface KeywordMatchResult {
  matched: boolean;
  matchedTerm?: string;
}

@Injectable()
export class KeywordFilterService {
  private wordBoundaryRegexes: RegExp[];

  constructor() {
    this.wordBoundaryRegexes = WORD_BOUNDARY_TERMS.map(
      (term) => new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'i'),
    );
  }

  check(text: string): KeywordMatchResult {
    const normalized = text.toLowerCase();

    for (let i = 0; i < this.wordBoundaryRegexes.length; i++) {
      if (this.wordBoundaryRegexes[i].test(normalized)) {
        return { matched: true, matchedTerm: WORD_BOUNDARY_TERMS[i] };
      }
    }

    for (const term of SUBSTRING_TERMS) {
      if (normalized.includes(term.toLowerCase())) {
        return { matched: true, matchedTerm: term };
      }
    }

    return { matched: false };
  }

  /**
   * Lightweight heuristic to decide whether a *clean* message (per keyword
   * check) is still worth sending to the paid moderation API — keeps API
   * costs down by not checking every single message.
   * Tune this based on what you see in production false-negatives.
   */
  isBorderlineCandidate(text: string): boolean {
    if (text.length < 3) return false;
    // Very rough heuristic — expand with your own signals over time
    // (e.g. certain word combinations, repeated punctuation masking, etc).
    const suspiciousPatterns = [/\b\d{1,2}\s*(yo|y\/o|years? old)\b/i];
    return suspiciousPatterns.some((p) => p.test(text));
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
