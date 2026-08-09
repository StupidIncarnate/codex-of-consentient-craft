/**
 * PURPOSE: Picks the banner-vs-progress-bar branch for the execution panel header. Reach for this
 * instead of `isTerminalQuestStatusGuard` whenever the caller needs the terminal set PLUS
 * `merging` — the one non-terminal status that still has no operations progress to show.
 *
 * USAGE:
 * shouldRenderStatusBannerQuestStatusGuard({ status: 'merging' });
 * // Returns true for complete, merging, merged, and abandoned; false for every other status.
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const shouldRenderStatusBannerQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].shouldRenderStatusBanner;
};
