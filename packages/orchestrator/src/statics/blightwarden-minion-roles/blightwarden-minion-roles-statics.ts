/**
 * PURPOSE: The five Blightwarden minion work-item roles, in dispatch order. Single source of truth
 *          for the parallel report-only finder set — consumed by stepsToWorkItemsTransformer (emits
 *          one work item per role), selectBatchLayerBroker (batches them together), and
 *          isBlightwardenMinionRoleGuard (membership test). Each entry must also exist in
 *          workItemRoleContract + agentRoleContract; the guard enforces that at compile time.
 *
 * USAGE:
 * blightwardenMinionRolesStatics.roles;
 * // Returns ['blightwarden-security-minion', 'blightwarden-dedup-minion', ...]
 */

export const blightwardenMinionRolesStatics = {
  roles: [
    'blightwarden-security-minion',
    'blightwarden-dedup-minion',
    'blightwarden-perf-minion',
    'blightwarden-integrity-minion',
    'blightwarden-dead-code-minion',
  ],
} as const;
