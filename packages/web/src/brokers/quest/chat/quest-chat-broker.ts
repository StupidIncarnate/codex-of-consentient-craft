/**
 * PURPOSE: Sends a chat message to an existing quest by POSTing to the per-quest chat endpoint
 *
 * USAGE:
 * const { chatProcessId } = await questChatBroker({ questId, message });
 * // Returns { chatProcessId: ProcessId }
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId, UserInput } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questChatBroker = async ({
  questId,
  message,
}: {
  questId: QuestId;
  message: UserInput;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questChat.replace(':questId', questId);

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body: { message },
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
