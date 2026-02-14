/**
 * PURPOSE: Sends a chat message for a quest, returns a process ID for tracking the response
 *
 * USAGE:
 * const result = await questChatBroker({questId, message, sessionId});
 * // Returns {chatProcessId: ProcessId}
 */
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId, SessionId, UserInput } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questChatBroker = async ({
  questId,
  message,
  sessionId,
}: {
  questId: QuestId;
  message: UserInput;
  sessionId?: SessionId;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questChat.replace(':questId', questId);

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body: { message, sessionId },
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
