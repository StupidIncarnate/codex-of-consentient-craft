/**
 * PURPOSE: Creates a new quest by posting title, user request, and project ID to the API
 *
 * USAGE:
 * const result = await questCreateBroker({projectId, title: 'Add Auth', userRequest: 'Implement authentication'});
 * // Returns {id: QuestId}
 */
import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { ProjectId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questCreateBroker = async ({
  projectId,
  title,
  userRequest,
}: {
  projectId: ProjectId;
  title: string;
  userRequest: string;
}): Promise<{ id: QuestId }> => {
  const response = await fetchPostAdapter<{ id: unknown }>({
    url: webConfigStatics.api.routes.quests,
    body: { projectId, title, userRequest },
  });

  return { id: questIdContract.parse(response.id) };
};
