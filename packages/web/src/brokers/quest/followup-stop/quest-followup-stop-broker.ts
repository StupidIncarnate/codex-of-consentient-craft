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

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questFollowupStopBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ stopped: boolean }> =>
  fetchPostAdapter<{ stopped: boolean }>({
    url: webConfigStatics.api.routes.questFollowupStop.replace(':questId', questId),
    body: undefined,
  });
