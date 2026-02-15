/**
 * PURPOSE: Stops a running Claude CLI chat process by posting to the stop endpoint
 *
 * USAGE:
 * await questChatStopBroker({questId, chatProcessId});
 * // Kills the running Claude process on the server
 */
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questChatStopBroker = async ({
  questId,
  chatProcessId,
}: {
  questId: QuestId;
  chatProcessId: ProcessId;
}): Promise<{ stopped: boolean }> => {
  const url = webConfigStatics.api.routes.questChatStop
    .replace(':questId', questId)
    .replace(':chatProcessId', chatProcessId);

  const result = await fetchPostAdapter<{ stopped: unknown }>({
    url,
    body: {},
  });

  return { stopped: result.stopped === true };
};
