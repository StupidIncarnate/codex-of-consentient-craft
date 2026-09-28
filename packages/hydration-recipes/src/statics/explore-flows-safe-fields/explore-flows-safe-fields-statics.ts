/**
 * PURPOSE: The `QuestFields` keys `questStatusInputAllowlistStatics.explore_flows`
 * (`@dungeonmaster/orchestrator`) admits alongside `title`/`comments`/`status` — the EARLIEST status
 * whose own allowlist entry admits any of them, since `created`'s own entry forbids all three
 * outright (`flowsRule: 'forbidden'`, none in `allowedFields`). `questReachRouteBroker` reaches for
 * this to know which of a caller's `extraFields` it may carry into a real modify call the moment the
 * walk reaches `explore_flows`.
 *
 * USAGE:
 * exploreFlowsSafeFieldsStatics.names.includes('flows');
 * // Returns true
 */

export const exploreFlowsSafeFieldsStatics = {
  names: ['flows', 'designDecisions', 'packagesAffected'],
} as const;
