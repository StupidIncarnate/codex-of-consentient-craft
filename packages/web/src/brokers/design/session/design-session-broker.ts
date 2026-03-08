/**
 * PURPOSE: Starts the Glyphsmith design session for a quest by posting to the design session endpoint
 *
 * USAGE:
 * const result = await designSessionBroker({questId, guildId, message});
 * // Returns {chatProcessId} for the spawned Glyphsmith session
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId, UserInput } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const designSessionBroker = async ({
  questId,
  guildId,
  message,
}: {
  questId: QuestId;
  guildId: GuildId;
  message: UserInput;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.designSession.replace(':questId', questId);

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body: { guildId, message },
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
