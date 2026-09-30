/**
 * PURPOSE: Abandons a quest by sending a POST request to the quest abandon API endpoint
 *
 * USAGE:
 * await questAbandonBroker({questId});
 * // Returns {abandoned: true} on success, throws on failure
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questAbandonResultContract } from '../../../contracts/quest-abandon-result/quest-abandon-result-contract';
import type { QuestAbandonResult } from '../../../contracts/quest-abandon-result/quest-abandon-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questAbandonBroker = async ({
  questId,
}: {
  questId: Quest['id'];
}): Promise<QuestAbandonResult> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.questAbandon.replace(':questId', questId),
    method: 'POST',
    body: undefined,
  });

  return questAbandonResultContract.parse(response);
};
