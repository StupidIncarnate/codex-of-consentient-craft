/**
 * PURPOSE: Pauses quest execution by sending a POST request to the quest pause API endpoint
 *
 * USAGE:
 * await questPauseBroker({questId});
 * // Returns {paused: true} on success, throws on failure
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questPauseResultContract } from '../../../contracts/quest-pause-result/quest-pause-result-contract';
import type { QuestPauseResult } from '../../../contracts/quest-pause-result/quest-pause-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questPauseBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestPauseResult> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.questPause.replace(':questId', questId),
    method: 'POST',
    body: undefined,
  });

  return questPauseResultContract.parse(response);
};
