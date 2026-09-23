/**
 * PURPOSE: Defines the reset budget for re-dispatching a crashed or killed (orphaned) agent
 * session. Reach for this over a hardcoded ceiling inline — `recoverOrphanedWorkItemsLayerBroker`
 * is the sole reader, and it is what blocks the quest for a human once the budget is spent instead
 * of resuming the same crash loop forever.
 *
 * USAGE:
 * slotManagerStatics.orphanRecovery.maxResets;
 * // Returns 3
 */
export const slotManagerStatics = {
  orphanRecovery: {
    // Give-up budget for re-dispatching a crashed/killed (orphaned) agent session. Each
    // recovery flips the item back to pending (resume marker + retained sessionId) and bumps
    // `retryCount`; once `retryCount` reaches this the crash loop is terminal and the quest
    // blocks rather than resuming forever.
    maxResets: 3,
  },
} as const;
