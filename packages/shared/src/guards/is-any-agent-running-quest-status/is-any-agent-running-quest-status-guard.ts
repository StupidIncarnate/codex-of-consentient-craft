/**
 * PURPOSE: Checks if a quest status indicates any agent is running (seek_* + in_progress)
 *
 * USAGE:
 * isAnyAgentRunningQuestStatusGuard({ status: 'in_progress' });
 * // Returns true for any status where an agent is actively executing
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isAnyAgentRunningQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isAnyAgentRunning;
};
