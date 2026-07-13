/**
 * PURPOSE: Defines immutable configuration values for slot-based orchestration phases
 *
 * USAGE:
 * slotManagerStatics.codeweaver.slotCount;
 * // Returns 3
 */

// `maxAttempts` on a role = the pt-continuation chain budget for its LOCKED (verify-tail)
// operation items: each `partially_complete` signal completes the current item and appends a
// "pt N" continuation; once the chain reaches maxAttempts the quest blocks instead of looping.
export const slotManagerStatics = {
  codeweaver: {
    maxAttempts: 3,
  },
  flowrider: {
    maxAttempts: 3,
  },
  siegemaster: {
    maxAttempts: 3,
  },
  lawbringer: {
    maxAttempts: 3,
  },
  blightwarden: {
    maxAttempts: 3,
  },
  pesteater: {
    maxAttempts: 3,
  },
  spiritmender: {
    maxAttempts: 3,
  },
  ward: {
    // Red-ward chain budget: the count of ward operation items of one wardMode since the last
    // green ward of that mode. Reaching it blocks the quest instead of appending another
    // spiritmender + fresh-ward pair.
    maxRetries: 3,
  },
  orphanRecovery: {
    // Give-up budget for re-dispatching a crashed/killed (orphaned) agent session. Each
    // recovery flips the item back to pending (resume marker + retained sessionId) and bumps
    // `retryCount`; once `retryCount` reaches this the crash loop is terminal and the quest
    // blocks rather than resuming forever.
    maxResets: 3,
  },
} as const;
