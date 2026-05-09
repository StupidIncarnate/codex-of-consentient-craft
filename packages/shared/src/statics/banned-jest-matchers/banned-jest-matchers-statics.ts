/**
 * PURPOSE: Single source of truth for jest matcher tokens banned across the codebase. Two
 * consumers read different projections of this list:
 * 1. The ESLint `jest/no-restricted-matchers` config in `@dungeonmaster/eslint-plugin` —
 *    keys on `name`, uses `eslintMessage` as the remediation diagnostic.
 * 2. The orchestrator's quest-assertion validator — scans step assertion prose for any
 *    `proseToken` (a `.` or `expect.` prefix + `(` suffix) so legitimate narrative wording
 *    like "the result toEqual flag" never matches; only literal jest-matcher syntax does.
 *
 * USAGE:
 * for (const entry of bannedJestMatchersStatics.entries) { ... }
 * // Iterate every banned matcher record. Each entry carries `name`, `proseToken`,
 * // `eslintMessage`, `eslint`, and `prose` flags so consumers can filter to the
 * // projection they need.
 *
 * bannedJestMatchersStatics.proseTokens;
 * // Returns the readonly list of prose tokens the orchestrator scans against. Each token
 * // includes punctuation (`.toEqual(`, `expect.any(`, etc.) so substring matches only fire
 * // on literal jest-matcher syntax, never on legitimate behavioral-prose use of the same
 * // word as English text.
 *
 * bannedJestMatchersStatics.eslintRestrictedMatchers;
 * // Returns the `Record<name, message>` shape consumed verbatim by jest-eslint's
 * // `no-restricted-matchers` rule option.
 *
 * WHEN-TO-USE: Anywhere that needs to enforce or describe the banned-matcher list — quest
 * step assertion validation, ESLint rule configuration, agent prompts, or documentation.
 */

const entries = [
  {
    name: 'toEqual',
    proseToken: '.toEqual(',
    eslintMessage: 'Use .toStrictEqual() instead',
    eslint: true,
    prose: true,
  },
  {
    name: 'toMatchObject',
    proseToken: '.toMatchObject(',
    eslintMessage: 'Use .toStrictEqual() instead',
    eslint: true,
    prose: true,
  },
  {
    name: 'toContain',
    proseToken: '.toContain(',
    eslintMessage: 'Use .toStrictEqual() for arrays or .toMatch(/^exact$/u) for strings',
    eslint: true,
    prose: true,
  },
  {
    name: 'toContainEqual',
    proseToken: undefined,
    eslintMessage: 'Use .toStrictEqual() on the full array instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'toBeTruthy',
    proseToken: undefined,
    eslintMessage: 'Use .toBe(true) instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'toBeFalsy',
    proseToken: undefined,
    eslintMessage: 'Use .toBe(false) instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'toHaveProperty',
    proseToken: '.toHaveProperty(',
    eslintMessage: 'Test actual value with .toBe() instead',
    eslint: true,
    prose: true,
  },
  {
    name: 'objectContaining',
    proseToken: 'expect.objectContaining(',
    eslintMessage: 'Test complete object instead',
    eslint: true,
    prose: true,
  },
  {
    name: 'arrayContaining',
    proseToken: undefined,
    eslintMessage: 'Test complete array instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'stringContaining',
    proseToken: undefined,
    eslintMessage: 'Test full string value with .toBe() or use anchored .toMatch(/^exact$/u)',
    eslint: true,
    prose: false,
  },
  {
    name: 'any(String)',
    proseToken: 'expect.any(',
    eslintMessage: 'Test actual string value instead',
    eslint: true,
    prose: true,
  },
  {
    name: 'any(Number)',
    proseToken: undefined,
    eslintMessage: 'Test actual number instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'any(Object)',
    proseToken: undefined,
    eslintMessage: 'Test complete object shape instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'toBeDefined',
    proseToken: undefined,
    eslintMessage: 'Test actual value with .toBe() or .toStrictEqual() instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'toHaveLength',
    proseToken: undefined,
    eslintMessage: 'Test complete array with .toStrictEqual() instead',
    eslint: true,
    prose: false,
  },
  {
    name: 'includes',
    proseToken: '.includes(',
    eslintMessage:
      'Use .toStrictEqual() on the full collection or .toBe() on the exact string instead',
    eslint: false,
    prose: true,
  },
] as const;

const proseTokens = entries.flatMap((entry) => (entry.prose ? [entry.proseToken] : []));

const eslintRestrictedMatchers = Object.freeze(
  Object.fromEntries(
    entries.filter((entry) => entry.eslint).map((entry) => [entry.name, entry.eslintMessage]),
  ),
);

export const bannedJestMatchersStatics = {
  entries,
  proseTokens,
  eslintRestrictedMatchers,
} as const;
