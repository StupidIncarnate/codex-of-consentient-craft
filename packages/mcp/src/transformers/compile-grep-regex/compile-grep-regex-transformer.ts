/**
 * PURPOSE: Compiles a grep pattern string into a RegExp, treating input as literal by default and opting into regex via `re:` prefix or leading `(?flags)`
 *
 * USAGE:
 * compileGrepRegexTransformer({ pattern: GrepPatternStub({ value: 'fs-mkdir.ts' }) });
 * // Returns /fs\-mkdir\.ts/gmu — a literal match, not a regex
 *
 * WHEN-TO-USE: Inside content-grep so user-typed kebab names and paths are not silently reinterpreted as regex
 */

import { contentGrepStatics } from '../../statics/content-grep/content-grep-statics';
import type { DiscoverInput } from '../../contracts/discover-input/discover-input-contract';

type GrepPattern = NonNullable<DiscoverInput['grep']>;

export const compileGrepRegexTransformer = ({ pattern }: { pattern: GrepPattern }): RegExp => {
  const patternStr = String(pattern);
  const inlineFlagsPattern = new RegExp(contentGrepStatics.inlineFlagsPattern, 'u');
  const metacharPattern = new RegExp(contentGrepStatics.metacharPattern, 'gu');

  // Explicit regex opt-in: `re:<pattern>`
  if (patternStr.startsWith(contentGrepStatics.regexPrefix)) {
    const raw = patternStr.slice(contentGrepStatics.regexPrefix.length);
    try {
      const flagMatch = inlineFlagsPattern.exec(raw);
      const extractedFlags = flagMatch ? (flagMatch[1] ?? '') : '';
      const cleanPattern = flagMatch ? raw.slice(flagMatch[0].length) : raw;
      const combinedFlags = Array.from(
        new Set((contentGrepStatics.requiredFlags + extractedFlags).split('')),
      ).join('');
      return new RegExp(cleanPattern, combinedFlags);
    } catch {
      const escaped = raw.replace(metacharPattern, '\\$&');
      return new RegExp(escaped, contentGrepStatics.requiredFlags);
    }
  }

  // Inline flags like `(?i)foo` are also treated as regex.
  if (inlineFlagsPattern.test(patternStr)) {
    try {
      const flagMatch = inlineFlagsPattern.exec(patternStr);
      const extractedFlags = flagMatch ? (flagMatch[1] ?? '') : '';
      const cleanPattern = flagMatch ? patternStr.slice(flagMatch[0].length) : patternStr;
      const combinedFlags = Array.from(
        new Set((contentGrepStatics.requiredFlags + extractedFlags).split('')),
      ).join('');
      return new RegExp(cleanPattern, combinedFlags);
    } catch {
      const escaped = patternStr.replace(metacharPattern, '\\$&');
      return new RegExp(escaped, contentGrepStatics.requiredFlags);
    }
  }

  // Default: literal substring — escape all regex metacharacters.
  const escaped = patternStr.replace(metacharPattern, '\\$&');
  return new RegExp(escaped, contentGrepStatics.requiredFlags);
};
