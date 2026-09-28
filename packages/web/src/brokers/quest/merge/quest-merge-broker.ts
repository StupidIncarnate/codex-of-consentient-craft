/**
 * PURPOSE: Starts the "Teleport with Booty (Merge)" action by sending a POST request to the quest
 * merge API endpoint.
 *
 * USAGE:
 * await questMergeBroker({questId});
 * // Returns {merging} on success, throws on failure
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questMergeResultContract } from '../../../contracts/quest-merge-result/quest-merge-result-contract';
import type { QuestMergeResult } from '../../../contracts/quest-merge-result/quest-merge-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questMergeBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestMergeResult> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.questMerge.replace(':questId', questId),
    method: 'POST',
    body: undefined,
  });

  return questMergeResultContract.parse(response);
};
