/**
 * PURPOSE: The five Blightwarden minion roles the blightwarden parent summons via the Agent tool
 *          (report-only, run in parallel — no work item, no operation item of their own). Single
 *          source of truth for the minion set — consumed by isBlightwardenMinionRoleGuard
 *          (membership test). Each entry must also exist in workItemRoleContract +
 *          agentRoleContract; the guard enforces that at compile time.
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
