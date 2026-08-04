/**
 * PURPOSE: The two Blightwarden minion roles the blightwarden parent summons via the Agent tool
 *          (fix-in-place, no work item, no operation item of their own). Single source of truth
 *          for the minion set — consumed by isBlightwardenMinionRoleGuard (membership test). Each
 *          entry must also exist in workItemRoleContract + agentRoleContract; the guard enforces
 *          that at compile time.
 *
 * USAGE:
 * blightwardenMinionRolesStatics.roles;
 * // Returns ['blightwarden-minion', 'blightwarden-crosscut-minion']
 */

export const blightwardenMinionRolesStatics = {
  roles: ['blightwarden-minion', 'blightwarden-crosscut-minion'],
} as const;
