/**
 * PURPOSE: Defines immutable configuration values for slot-based orchestration phases
 *
 * USAGE:
 * slotManagerStatics.codeweaver.slotCount;
 * // Returns 3
 */

// `maxAttempts` on a role = the pt-continuation chain budget for its LOCKED (verify-tail)
// operation items: each `operationStatus: 'partial'` outcome completes the current item and
// appends a "pt N" continuation; once the chain reaches maxAttempts the quest blocks instead of
// looping. It gates LOCKED items only — a codeweaver item is minted UNLOCKED precisely so its chain
// stays unbounded, because the flows are the acceptance target and the work has to land. That is
// why `codeweaver` still has a key here despite never being gated by it: the ladder's final `else`
// hands an unnamed role spiritmender's budget, so the key documents the role rather than budgeting
// it, and removing it would silently start bounding codeweaver the day an item is minted locked.
export const slotManagerStatics = {
  codeweaver: {
    maxAttempts: 3,
  },
  flowrider: {
    maxAttempts: 3,
  },
  groundstomper: {
    maxAttempts: 3,
  },
  siegemaster: {
    maxAttempts: 3,
  },
  pesteater: {
    maxAttempts: 3,
  },
  spiritmender: {
    maxAttempts: 3,
  },
  // Every dispatched role needs its own key: the pt-budget ladder's final `else` hands any role it
  // does not name spiritmender's budget, so a role without a key here is silently mis-budgeted
  // rather than erroring.
  warpgate: {
    maxAttempts: 3,
  },
  ward: {
    // Red-ward chain budget: the count of ward operation items of one wardMode since the last
    // green ward of that mode. Reaching it blocks the quest instead of appending another
    // spiritmender + fresh-ward pair.
    maxRetries: 3,
  },
  riftcarver: {
    // Red-carve chain budget: the count of riftcarver operation items since the last GREEN
    // riftcarver. Only the repairable failures (node_modules, build) spend it — a git-state or
    // permission failure blocks on the spot, whatever the budget says. `maxRetries` rather than
    // `maxAttempts` because, exactly like ward, the chain is counted from the ledger's own
    // role-filtered history rather than from one item's pt continuations.
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
