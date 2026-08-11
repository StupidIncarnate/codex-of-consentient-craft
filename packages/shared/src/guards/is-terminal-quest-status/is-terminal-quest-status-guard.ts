/**
 * PURPOSE: Asks whether a quest has stopped for good, so nothing may dispatch, recover or watch it
 * any longer. Reach for `shouldRenderStatusBannerQuestStatusGuard` instead when the question is
 * only "does this quest still have relay progress to report", which is also false at `merging`.
 *
 * USAGE:
 * isTerminalQuestStatusGuard({ status: 'complete' });
 * // Returns true for complete, merged and abandoned
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isTerminalQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isTerminal;
};
