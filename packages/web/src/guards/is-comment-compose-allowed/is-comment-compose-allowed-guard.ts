/**
 * PURPOSE: Checks whether the comment icon button and the comment-queue toolbar may render for a
 * quest — the compose affordance, not the read-only comment count badge
 *
 * USAGE:
 * isCommentComposeAllowedGuard({ quest });
 * // Returns true when the quest status precedes spec approval AND has a resumable chat session
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import {
  hasResumableChatSessionGuard,
  isBeforeSpecApprovedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

// Queueing and sending a comment batch are spec-review tools, so the compose affordance is gone
// once the quest is approved — the status gate mirrors #dd-comment-controls-before-approved.
// The chat endpoint rejects a quest with no chaoswhisperer/glyphsmith work item carrying a
// sessionId, so composing a batch that could never be delivered would be a dead end — the session
// gate mirrors #dd-toolbar-hidden-without-session. Both must hold; neither implies the other.
export const isCommentComposeAllowedGuard = ({ quest }: { quest?: Quest }): boolean => {
  if (!quest) {
    return false;
  }
  return (
    isBeforeSpecApprovedQuestStatusGuard({ status: quest.status }) &&
    hasResumableChatSessionGuard({ quest })
  );
};
