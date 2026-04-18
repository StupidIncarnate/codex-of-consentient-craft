/**
 * PURPOSE: Checks if a quest status is terminal (complete or abandoned)
 *
 * USAGE:
 * isTerminalQuestStatusGuard({ status: 'complete' });
 * // Returns true for complete and abandoned statuses
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isTerminalQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isTerminal;
};
