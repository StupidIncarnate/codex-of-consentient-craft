/**
 * PURPOSE: Checks whether a work-item role is run as a deterministic COMMAND — a git/npm/ward
 * sequence a dispatcher executes itself — rather than handed to a Claude session.
 *
 * USAGE:
 * isCommandWorkItemRoleGuard({ role: 'riftcarver' });
 * // Returns true for ward and riftcarver; false for every Claude-dispatched role.
 *
 * WHEN-TO-USE: Wherever a dispatch site chooses a work item's `spawnerType`, or decides whether an
 *   item is Claude's to run at all. One predicate is what keeps `ward` and `riftcarver` from
 *   drifting apart across the two dispatchers: a `role === 'ward'` ternary silently classifies every
 *   later command role as an agent, and the miss surfaces downstream as agentRoleContract throwing
 *   on a name it does not enumerate.
 * WHEN-NOT-TO-USE: To decide whether a work item is the user's own conversation — that is
 *   isChatWorkItemRoleGuard, whose roles are neither commands nor dispatched agents.
 */

import type { WorkItemRole } from '../../contracts/work-item-role/work-item-role-contract';
import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';

const COMMAND_ROLES: ReadonlySet<WorkItemRole> = new Set(workItemRoleStatics.command);

export const isCommandWorkItemRoleGuard = ({ role }: { role?: WorkItemRole }): boolean => {
  if (role === undefined) {
    return false;
  }
  return COMMAND_ROLES.has(role);
};
