/**
 * PURPOSE: Checks if a quest status should render the execution panel (planning + execution + terminal)
 *
 * USAGE:
 * shouldRenderExecutionPanelQuestStatusGuard({ status: 'complete' });
 * // Returns true for statuses where the execution panel UI is visible
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const shouldRenderExecutionPanelQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].shouldRenderExecutionPanel;
};
