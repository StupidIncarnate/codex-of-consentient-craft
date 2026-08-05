/**
 * PURPOSE: Checks whether a quest has a chat work item (chaoswhisperer, glyphsmith, or bughunt)
 * carrying a sessionId
 *
 * USAGE:
 * hasResumableChatSessionGuard({ quest });
 * // Returns true if quest.workItems contains a chat-role item with a sessionId
 */

import type { Quest } from '../../contracts/quest/quest-contract';
import { isChatWorkItemRoleGuard } from '../is-chat-work-item-role/is-chat-work-item-role-guard';

// The comment batch route (packages/server/.../quest-comment-batch-responder.ts) rejects a quest
// whose workItems carry no chat-role item with a sessionId — there is no session to resume against,
// so the batch can never be delivered. This guard mirrors that same lookup so the UI can hide the
// comment compose affordance instead of letting the user build a batch that is guaranteed to fail
// on send. Both sides read isChatWorkItemRoleGuard, so they cannot disagree about which roles count.
export const hasResumableChatSessionGuard = ({ quest }: { quest?: Quest }): boolean => {
  if (!quest) {
    return false;
  }
  return quest.workItems.some(
    (workItem) => isChatWorkItemRoleGuard({ role: workItem.role }) && Boolean(workItem.sessionId),
  );
};
