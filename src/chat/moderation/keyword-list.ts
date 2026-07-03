/**
 * Placeholder keyword list for the fast, in-process pre-filter.
 *
 * Deliberately left minimal here — do NOT ship this list as-is. Replace it
 * with an established, maintained explicit-content wordlist (there are
 * several open-source ones covering multiple languages) plus any terms
 * specific to your user base. Keep this list in a DB table or a config
 * service instead of hardcoded, if you want admins to update it without a
 * deploy — a simple `ModerationKeyword` table + Redis cache works well.
 *
 * Matching is case-insensitive and checks for whole-word / substring hits.
 * Tune `WORD_BOUNDARY_TERMS` vs `SUBSTRING_TERMS` based on false-positive
 * rate you observe in testing.
 */

export const WORD_BOUNDARY_TERMS: string[] = [
  // Add explicit terms requiring exact word match here.
  // e.g. 'example_term',
];

export const SUBSTRING_TERMS: string[] = [
  // Add terms that should match even inside other words here
  // (use sparingly — higher false-positive risk).
];
