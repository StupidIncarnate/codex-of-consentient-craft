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
 *
 * By default, identifier-shaped patterns (no regex metacharacters, 2+ word tokens) are
 * compiled into a cross-naming-convention matcher: `OrchestrationEventType` becomes
 * `Orchestration[-_\s]?Event[-_\s]?Type` with the case-insensitive flag, so it also
 * hits `orchestration-event-type`, `orchestration_event_type`, etc. Pass `strict: true`
 * to disable this and treat the pattern as a literal regex.
 */

import { contentGrepStatics } from '../../statics/content-grep/content-grep-statics';
import { identifierTokenizeTransformer } from '../identifier-tokenize/identifier-tokenize-transformer';
import type { DiscoverInput } from '../../contracts/discover-input/discover-input-contract';

type GrepPattern = NonNullable<DiscoverInput['grep']>;
type StrictGrep = NonNullable<DiscoverInput['strict']>;

export const compileGrepRegexTransformer = ({
  pattern,
  strict,
}: {
  pattern: GrepPattern;
  strict?: StrictGrep;
}): RegExp => {
  const patternStr = String(pattern);
  const inlineFlagsPattern = new RegExp(contentGrepStatics.inlineFlagsPattern, 'u');
  const metacharPattern = new RegExp(contentGrepStatics.metacharPattern, 'gu');
  const metacharProbe = new RegExp(contentGrepStatics.metacharPattern, 'u');

  // Cross-naming-convention identifier matcher: only if not strict, no regex metachars,
  // no `re:` prefix, no inline flags, and the pattern tokenizes to 2+ word tokens.
  // Single tokens (`if`, `error`) stay literal to avoid noisy case-insensitive widening.
  if (
    strict !== true &&
    !patternStr.startsWith(contentGrepStatics.regexPrefix) &&
    !inlineFlagsPattern.test(patternStr) &&
    !metacharProbe.test(patternStr)
  ) {
    const tokens = identifierTokenizeTransformer({ identifier: patternStr });
    if (tokens.length >= contentGrepStatics.minCrossConventionTokens) {
      const crossConventionSource = tokens
        .map((token) => String(token))
        .join(contentGrepStatics.crossConventionSeparatorPattern);
      return new RegExp(crossConventionSource, contentGrepStatics.crossConventionFlags);
    }
  }

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
