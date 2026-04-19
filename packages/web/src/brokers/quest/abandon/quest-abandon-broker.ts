/**
 * PURPOSE: Abandons a quest by sending a POST request to the quest abandon API endpoint
 *
 * USAGE:
 * await questAbandonBroker({questId});
 * // Returns {abandoned: true} on success, throws on failure
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questAbandonBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ abandoned: boolean }> =>
  fetchPostAdapter<{ abandoned: boolean }>({
    url: webConfigStatics.api.routes.questAbandon.replace(':questId', questId),
    body: {},
  });
