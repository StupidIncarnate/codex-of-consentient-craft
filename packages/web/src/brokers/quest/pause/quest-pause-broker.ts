/**
 * PURPOSE: Pauses quest execution by sending a POST request to the quest pause API endpoint
 *
 * USAGE:
 * await questPauseBroker({questId});
 * // Returns {paused: true} on success, throws on failure
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questPauseBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ paused: boolean }> =>
  fetchPostAdapter<{ paused: boolean }>({
    url: webConfigStatics.api.routes.questPause.replace(':questId', questId),
    body: {},
  });
