/**
 * PURPOSE: Checks whether a quest has a chat work item (chaoswhisperer or glyphsmith) carrying a sessionId
 *
 * USAGE:
 * hasResumableChatSessionGuard({ quest });
 * // Returns true if quest.workItems contains a chaoswhisperer or glyphsmith item with a sessionId
 */

import type { Quest } from '../../contracts/quest/quest-contract';

// The comment batch route (packages/server/.../quest-comment-batch-responder.ts) rejects a quest
// whose workItems carry no chaoswhisperer or glyphsmith item with a sessionId — there is no session
// to resume against, so the batch can never be delivered. This guard mirrors that same lookup so the
// UI can hide the comment compose affordance instead of letting the user build a batch that is
// guaranteed to fail on send.
export const hasResumableChatSessionGuard = ({ quest }: { quest?: Quest }): boolean => {
  if (!quest) {
    return false;
  }
  return quest.workItems.some(
    (workItem) =>
      (workItem.role === 'chaoswhisperer' || workItem.role === 'glyphsmith') &&
      Boolean(workItem.sessionId),
  );
};
