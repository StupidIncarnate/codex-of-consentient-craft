/**
 * PURPOSE: Starts quest execution by sending a POST request to the quest start API endpoint
 *
 * USAGE:
 * await questStartBroker({questId});
 * // Returns {processId} on success, throws on failure
 */

import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questStartBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ processId: ProcessId }> =>
  fetchPostAdapter<{ processId: ProcessId }>({
    url: webConfigStatics.api.routes.questStart.replace(':questId', questId),
    body: {},
  });
