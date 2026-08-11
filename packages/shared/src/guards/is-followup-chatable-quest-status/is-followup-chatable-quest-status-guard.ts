/**
 * PURPOSE: Checks if a quest status permits opening a follow-up chat session — the gate the
 * followup route re-reads quest.json status against server-side, so a tab left open while the
 * quest moves back to in_progress or merging cannot spawn a session.
 *
 * USAGE:
 * isFollowupChatableQuestStatusGuard({ status: 'merged' });
 * // Returns true for blocked, complete, and merged; false for every other status.
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isFollowupChatableQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isFollowupChatable;
};
