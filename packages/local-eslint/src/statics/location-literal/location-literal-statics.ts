/**
 * PURPOSE: Configuration knobs for the no-bare-location-literals rule — path allowlists for legitimate location-literal readers (locations statics + locations resolver brokers + tests/stubs/proxies/harnesses) and the min-length filter that drops false-positive single-word literals.
 *
 * USAGE:
 * import { locationLiteralStatics } from './statics/location-literal/location-literal-statics';
 * locationLiteralStatics.minRetainedLiteralLength;
 * // Returns 8
 *
 * WHEN-TO-USE: Only the no-bare-location-literals rule should consume this. Application code that needs a path uses the resolver brokers under @dungeonmaster/shared/brokers/locations instead.
 */
export const locationLiteralStatics = {
  // Length threshold below which non-dot/non-slash literals are dropped from the banned set
  // (filters generic single words like 'design', 'guilds', 'projects', 'subagents').
  minRetainedLiteralLength: 8,
  // Path substrings whose files may contain raw location literals (the canonical readers).
  allowlistPathSubstrings: [
    // The statics module that owns the literals.
    '/packages/shared/src/statics/locations/',
    // Resolver brokers that compose absolute paths from the literals.
    '/packages/shared/src/brokers/locations/',
  ],
  // Path regex fragments — files matching are considered tests/stubs/proxies/harnesses
  // and are exempt from the rule (literals appear in test fixtures, stubs, etc.).
  allowlistPathRegexSources: [
    '\\.test\\.ts$',
    '\\.test\\.tsx$',
    '\\.integration\\.test\\.ts$',
    '\\.integration\\.test\\.tsx$',
    '\\.spec\\.ts$',
    '\\.spec\\.tsx$',
    '\\.e2e\\.test\\.ts$',
    '\\.e2e\\.test\\.tsx$',
    '\\.stub\\.ts$',
    '\\.stub\\.tsx$',
    '\\.proxy\\.ts$',
    '\\.proxy\\.tsx$',
    '\\.harness\\.ts$',
  ],
} as const;
