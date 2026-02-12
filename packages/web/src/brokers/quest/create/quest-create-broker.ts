/**
 * PURPOSE: Creates a new quest by posting title and user request to the API
 *
 * USAGE:
 * const result = await questCreateBroker({title: 'Add Auth', userRequest: 'Implement authentication'});
 * // Returns {id: QuestId}
 */
import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questCreateBroker = async ({
  title,
  userRequest,
}: {
  title: string;
  userRequest: string;
}): Promise<{ id: QuestId }> => {
  const response = await fetchPostAdapter<{ id: unknown }>({
    url: webConfigStatics.api.routes.quests,
    body: { title, userRequest },
  });

  return { id: questIdContract.parse(response.id) };
};
