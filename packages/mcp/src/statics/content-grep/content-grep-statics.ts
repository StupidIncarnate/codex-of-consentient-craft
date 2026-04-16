/**
 * PURPOSE: Constants for the content-grep transformer covering pattern parsing and flag handling
 *
 * USAGE:
 * import { contentGrepStatics } from '../../statics/content-grep/content-grep-statics';
 * contentGrepStatics.regexPrefix; // 're:'
 *
 * WHEN-TO-USE: Referenced by content-grep-transformer to avoid inline magic strings
 */
export const contentGrepStatics = {
  /** Prefix that opts a grep pattern into regex mode (kept for backwards-compat; default is now regex). */
  regexPrefix: 're:',
  /** Regex source for detecting inline flag syntax like `(?i)` at the start of a pattern. */
  inlineFlagsPattern: '^\\(\\?([gimsuy]+)\\)',
  /** Regex source for matching regex metacharacters so a literal pattern can be escaped. */
  metacharPattern: '[.*+?^${}()|[\\]\\\\]',
  /** Required regex flags: global (g), multiline (m), unicode (u). */
  requiredFlags: 'gmu',
} as const;
