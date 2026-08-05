/**
 * PURPOSE: Checks whether a work-item role is an interactive CHAT role — one whose session is a
 * conversation with the user (spec/design/bug intake) rather than a dispatched execution session.
 *
 * USAGE:
 * isChatWorkItemRoleGuard({ role: 'bughunt' });
 * // Returns true for chaoswhisperer, glyphsmith, and bughunt; false for every execution role.
 *
 * WHEN-TO-USE: Anywhere the distinction "is this work item the user's own conversation?" decides
 *   behaviour — resolving which sessionId a chat/comment/clarify POST resumes, force-completing
 *   intake items at Start Quest, or deciding a work item is briefed by a slash command rather than
 *   by get-agent-prompt. One predicate keeps those call sites from drifting apart as roles are
 *   added; a new chat role is registered in workItemRoleStatics.chat once instead of in a dozen
 *   `||` chains.
 * WHEN-NOT-TO-USE: To decide whether a role executes ledger work — that is the quest type's
 *   `roles` list in questTypeRegistryStatics.
 */

import type { WorkItemRole } from '../../contracts/work-item-role/work-item-role-contract';
import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';

const CHAT_ROLES: ReadonlySet<WorkItemRole> = new Set(workItemRoleStatics.chat);

export const isChatWorkItemRoleGuard = ({ role }: { role?: WorkItemRole }): boolean => {
  if (role === undefined) {
    return false;
  }
  return CHAT_ROLES.has(role);
};
