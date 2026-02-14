/**
 * PURPOSE: Creates a new quest by posting title, user request, and guild ID to the API
 *
 * USAGE:
 * const result = await questCreateBroker({guildId, title: 'Add Auth', userRequest: 'Implement authentication'});
 * // Returns {id: QuestId}
 */
import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questCreateBroker = async ({
  guildId,
  title,
  userRequest,
}: {
  guildId: GuildId;
  title: string;
  userRequest: string;
}): Promise<{ id: QuestId }> => {
  const response = await fetchPostAdapter<{ questId: unknown }>({
    url: webConfigStatics.api.routes.quests,
    body: { guildId, title, userRequest },
  });

  return { id: questIdContract.parse(response.questId) };
};
