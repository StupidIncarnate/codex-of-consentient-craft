/**
 * PURPOSE: True when a work-item role is any Blightwarden minion role (the parallel report-only
 *          finders in `blightwardenMinionRolesStatics`), false for the synthesizer `blightwarden`
 *          role and everything else. Used to batch the minions for parallel dispatch and to route
 *          their non-blocking failure semantics in the signal-back handler.
 *
 * USAGE:
 * isBlightwardenMinionRoleGuard({ role: 'blightwarden-group-minion' });
 * // Returns true
 * isBlightwardenMinionRoleGuard({ role: 'blightwarden' });
 * // Returns false (the synthesizer, not a minion)
 */

import type { WorkItemRole } from '@dungeonmaster/shared/contracts';

import { blightwardenMinionRolesStatics } from '../../statics/blightwarden-minion-roles/blightwarden-minion-roles-statics';

// Compile-time assertion that every statics entry is a valid WorkItemRole — drift here is a typecheck error.
const minionRoles: readonly WorkItemRole[] = blightwardenMinionRolesStatics.roles;

export const isBlightwardenMinionRoleGuard = ({ role }: { role?: WorkItemRole }): boolean => {
  if (role === undefined) {
    return false;
  }
  return minionRoles.includes(role);
};
