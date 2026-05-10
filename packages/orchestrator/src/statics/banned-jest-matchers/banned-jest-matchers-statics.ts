/**
 * PURPOSE: Canonical list of jest matcher syntax tokens banned from step assertion input/expected prose
 *
 * USAGE:
 * for (const matcher of bannedJestMatchersStatics) { ... }
 * // Iterates banned matcher tokens. Each entry includes punctuation (a leading dot or
 * // trailing open paren) so legitimate prose like "the result toEqual flag" never matches —
 * // only literal jest-matcher syntax does.
 *
 * Source of truth: project testing-patterns "Forbidden matchers" list, restricted to the
 * tokens that have zero legitimate behavioral-prose use. Step assertions describe inputs
 * and outcomes in narrative form; finding any of these in the assertion text means the
 * author wrote test code where a behavioral predicate description belongs.
 */

export const bannedJestMatchersStatics = [
  '.toContain(',
  '.toMatchObject(',
  '.toEqual(',
  '.toHaveProperty(',
  '.includes(',
  'expect.any(',
  'expect.objectContaining(',
] as const;
