/**
 * PURPOSE: Defines immutable configuration values for slot-based orchestration phases
 *
 * USAGE:
 * slotManagerStatics.codeweaver.slotCount;
 * // Returns 3
 */

export const slotManagerStatics = {
  codeweaver: {
    slotCount: 3,
    maxFollowupDepth: 5,
    // Code-recovery retry budget: a codeweaver `failed` (code it could not build/verify) splices a
    // spiritmender fix + a fresh codeweaver re-run until this many total attempts are spent, then the
    // failure escalates to a PathSeeker replan (never an immediate block). See questRecoverRoleBroker.
    maxAttempts: 3,
  },
  flowrider: {
    concurrentLimit: 3,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
    maxAttempts: 3,
  },
  siegemaster: {
    concurrentLimit: 3,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
    // Total Siegemaster runs allowed per flow before a `failed` signal escalates (spiritmender +
    // ward + fresh siege each attempt). Mirrors ward.maxRetries (used as maxAttempts): attempts
    // 0..maxAttempts-1, recover on the first maxAttempts-1, escalate to a PathSeeker replan on the
    // last. A siege `failed` splices a spiritmender + ward + a fresh siege retry until this budget
    // is spent.
    maxAttempts: 3,
  },
  lawbringer: {
    concurrentLimit: 3,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
    maxAttempts: 3,
  },
  blightwarden: {
    // Code-recovery retry budget for the synthesizer's `failed` (code it could not fix inline).
    maxAttempts: 3,
  },
  pesteater: {
    // Code-recovery retry budget for the bug-hunt front's `failed`.
    maxAttempts: 3,
  },
  ward: {
    maxRetries: 3,
    spiritmenderMaxConcurrent: 3,
    spiritmenderBatchSize: 3,
  },
  pathseeker: {
    // The single PathSeeker replan loop budget. EVERY plan-hole escalation across the quest funnels
    // here: a `failed-replan` signal, or any role/ward exhausting its code-recovery retries. Counted
    // across the quest's `insertedBy`-stamped pathseeker replans. Once this many replans have been
    // spliced, a further replan request BLOCKs — the sole block path (PathSeeker's loop is spent).
    replanMaxCycles: 5,
  },
  orphanRecovery: {
    // Give-up budget for re-dispatching a crashed/killed (orphaned) agent. Each get-next-step scan
    // that finds an orphaned in_progress item resets it to pending and bumps `retryCount`; once
    // `retryCount` reaches this, the crash is treated as a plan hole and escalates to a PathSeeker
    // replan rather than re-dispatching forever.
    maxResets: 3,
  },
} as const;
