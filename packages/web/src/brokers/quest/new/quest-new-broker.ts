/**
 * PURPOSE: Creates a new quest from a chat message by POSTing to the guild-scoped quest-new endpoint
 *
 * USAGE:
 * const { questId, chatProcessId } = await questNewBroker({ guildId, message });
 * // Returns { questId: QuestId, chatProcessId: ProcessId }
 */

import { processIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId, UserInput } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questNewBroker = async ({
  guildId,
  message,
}: {
  guildId: GuildId;
  message: UserInput;
}): Promise<{ questId: QuestId; chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questNew.replace(':guildId', guildId);

  const response = await fetchPostAdapter<{ questId: unknown; chatProcessId: unknown }>({
    url,
    body: { message },
  });

  return {
    questId: questIdContract.parse(response.questId),
    chatProcessId: processIdContract.parse(response.chatProcessId),
  };
};
