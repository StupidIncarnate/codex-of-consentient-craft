/**
 * PURPOSE: Creates a new quest from a chat message by POSTing to the guild-scoped quest-new endpoint
 *
 * USAGE:
 * const { questId, chatProcessId } = await questNewBroker({ guildId, message, questType });
 * // Returns { questId: QuestId, chatProcessId: ProcessId }
 */

import { processIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  ProcessId,
  QuestId,
  QuestType,
  UserInput,
} from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questNewBroker = async ({
  guildId,
  message,
  questType,
}: {
  guildId: GuildId;
  message: UserInput;
  // Which pipeline the new quest follows. Omitted defaults to feature server-side; 'bug-hunt'
  // spawns the BugHunt intake instead of ChaosWhisperer.
  questType?: QuestType;
}): Promise<{ questId: QuestId; chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questNew.replace(':guildId', guildId);

  const response = await fetchPostAdapter<{ questId: unknown; chatProcessId: unknown }>({
    url,
    body: { message, ...(questType === undefined ? {} : { questType }) },
  });

  return {
    questId: questIdContract.parse(response.questId),
    chatProcessId: processIdContract.parse(response.chatProcessId),
  };
};
