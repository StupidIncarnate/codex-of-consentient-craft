/**
 * PURPOSE: Checks if a quest status permits dispatching a merge — the gate the merge route
 * re-reads quest.json status against server-side, so a browser tab left open on a quest that has
 * since merged (or gone back to running) cannot dispatch a second merge. Reach for
 * `isFollowupChatableQuestStatusGuard` instead when the question is "can the user still talk to
 * this quest", which stays true after a merge.
 *
 * USAGE:
 * isMergeableQuestStatusGuard({ status: 'blocked' });
 * // Returns true for blocked and complete; false for every other status.
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isMergeableQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isMergeable;
};
