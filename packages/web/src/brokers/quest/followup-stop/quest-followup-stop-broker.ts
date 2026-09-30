/**
 * PURPOSE: Stops the tavernkeeper mid-turn for the FOLLOW-UP tab's STOP button. Reach for this over
 * `questPauseBroker`, which that button used to call: pause is a QUEST-level halt that kills every
 * process and flips status to `paused`, and on the blocked/complete/merged quests a follow-up chat
 * runs against that is either an illegal transition or a silent loss of the whole quest.
 *
 * USAGE:
 * const { stopped } = await questFollowupStopBroker({ questId });
 * // stopped is false when nothing was running — a STOP the reader pressed either side of a turn
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questFollowupStopResultContract } from '../../../contracts/quest-followup-stop-result/quest-followup-stop-result-contract';
import type { QuestFollowupStopResult } from '../../../contracts/quest-followup-stop-result/quest-followup-stop-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questFollowupStopBroker = async ({
  questId,
}: {
  questId: Quest['id'];
}): Promise<QuestFollowupStopResult> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.questFollowupStop.replace(':questId', questId),
    method: 'POST',
    body: undefined,
  });

  return questFollowupStopResultContract.parse(response);
};
