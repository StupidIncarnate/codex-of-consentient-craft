/**
 * PURPOSE: Checks if a quest status is the user-abandoned terminal status (abandoned) — the
 * deliberate terminal status that is NOT successful completion. Distinguishes abandoned from the
 * other terminal status `complete`, which work-item derivation is allowed to re-open.
 *
 * USAGE:
 * isAbandonedQuestStatusGuard({ status: 'abandoned' });
 * // Returns true only for the abandoned status
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isAbandonedQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  const metadata = questStatusMetadataStatics.statuses[status];
  return metadata.isTerminal && !metadata.isCompletedSuccessfully;
};
