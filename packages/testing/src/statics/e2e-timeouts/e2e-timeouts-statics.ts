/**
 * PURPOSE: Immutable timeout configuration values for E2E testing
 *
 * USAGE:
 * await testbed.waitForScreen({ screen: 'list', timeout: e2eTimeoutsStatics.claudeOperation });
 * // Uses 90 second timeout for Claude operations
 */

export const e2eTimeoutsStatics = {
  /** Default wait for screen transitions (30 seconds) */
  defaultWait: 30000,

  /** Timeout for Claude operations (90 seconds) */
  claudeOperation: 90000,

  /** Interval between screen polls (100ms) */
  pollInterval: 100,

  /** CLI process startup time (5 seconds) */
  processStartup: 5000,
} as const;
