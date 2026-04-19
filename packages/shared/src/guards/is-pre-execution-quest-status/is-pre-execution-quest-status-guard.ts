/**
 * PURPOSE: Checks if a quest status is in the pre-execution phase (intake + spec-* + design)
 *
 * USAGE:
 * isPreExecutionQuestStatusGuard({ status: 'explore_flows' });
 * // Returns true for pre-execution statuses, false otherwise
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isPreExecutionQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isPreExecution;
};
