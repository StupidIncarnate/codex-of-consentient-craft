/**
 * PURPOSE: Compiles a grep pattern string into a RegExp, treating input as regex (like grep) with safe fallback to literal on syntax errors
 *
 * USAGE:
 * compileGrepRegexTransformer({ pattern: GrepPatternStub({ value: 'delete|remove' }) });
 * // Returns /delete|remove/gmu — alternation works naturally
 *
 * WHEN-TO-USE: Inside content-grep as an LLM-facing wrapper. LLMs write regex naturally
 * (`.*`, `\w+`, `^export`, `|` alternation). Invalid regex like `broker.parse(input`
 * falls back to an escaped literal match so search still finds obvious text.
 */

import { contentGrepStatics } from '../../statics/content-grep/content-grep-statics';
import type { DiscoverInput } from '../../contracts/discover-input/discover-input-contract';

type GrepPattern = NonNullable<DiscoverInput['grep']>;

export const compileGrepRegexTransformer = ({ pattern }: { pattern: GrepPattern }): RegExp => {
  const patternStr = String(pattern);
  const inlineFlagsPattern = new RegExp(contentGrepStatics.inlineFlagsPattern, 'u');
  const metacharPattern = new RegExp(contentGrepStatics.metacharPattern, 'gu');

  // Explicit regex opt-in: `re:<pattern>` — strips prefix, preserves inline flags.
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

  // Inline flags like `(?i)foo` — extract flags, strip them from the pattern.
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

  // Default: try regex (LLMs use regex naturally). Fall back to escaped literal on SyntaxError.
  try {
    return new RegExp(patternStr, contentGrepStatics.requiredFlags);
  } catch {
    const escaped = patternStr.replace(metacharPattern, '\\$&');
    return new RegExp(escaped, contentGrepStatics.requiredFlags);
  }
};
