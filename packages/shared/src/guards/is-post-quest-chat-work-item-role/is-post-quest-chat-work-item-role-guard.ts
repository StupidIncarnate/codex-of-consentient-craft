/**
 * PURPOSE: Checks whether a work-item role is the POST-QUEST follow-up chat — as opposed to the
 * spec/design/bug intake chat the main composer drives. `tavernkeeper` has its own composer in the
 * FOLLOW-UP tab, so a selector looking for "the chat thread the main composer resumes" must subtract
 * this predicate's roles from isChatWorkItemRoleGuard's.
 *
 * USAGE:
 * isPostQuestChatWorkItemRoleGuard({ role: 'tavernkeeper' });
 * // Returns true for tavernkeeper; false for every other role, including the other chat roles.
 */

import type { WorkItemRole } from '../../contracts/work-item-role/work-item-role-contract';
import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';

const POST_QUEST_CHAT_ROLES: ReadonlySet<WorkItemRole> = new Set(workItemRoleStatics.postQuestChat);

export const isPostQuestChatWorkItemRoleGuard = ({ role }: { role?: WorkItemRole }): boolean => {
  if (role === undefined) {
    return false;
  }
  return POST_QUEST_CHAT_ROLES.has(role);
};
