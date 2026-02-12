/**
 * PURPOSE: Starts quest execution by posting to the API, returns a process ID for tracking
 *
 * USAGE:
 * const processId = await questStartBroker({questId});
 * // Returns ProcessId branded string
 */
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questStartBroker = async ({ questId }: { questId: QuestId }): Promise<ProcessId> => {
  const result = await fetchPostAdapter<{ processId: unknown }>({
    url: webConfigStatics.api.routes.questStart.replace(':questId', questId),
    body: { questId },
  });

  return processIdContract.parse(result.processId);
};
