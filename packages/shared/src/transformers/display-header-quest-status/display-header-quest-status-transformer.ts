/**
 * PURPOSE: Returns the display header label for a given quest status
 *
 * USAGE:
 * displayHeaderQuestStatusTransformer({ status: 'in_progress' });
 * // Returns DisplayHeader('IN PROGRESS')
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import {
  displayHeaderContract,
  type DisplayHeader,
} from '../../contracts/display-header/display-header-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const displayHeaderQuestStatusTransformer = ({
  status,
}: {
  status: QuestStatus;
}): DisplayHeader =>
  displayHeaderContract.parse(questStatusMetadataStatics.statuses[status].displayHeader);
