/**
 * PURPOSE: Starts the "Teleport with Booty (Merge)" action by sending a POST request to the quest
 * merge API endpoint.
 *
 * USAGE:
 * await questMergeBroker({questId});
 * // Returns {merging} on success, throws on failure
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questMergeBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ merging: boolean }> =>
  fetchPostAdapter<{ merging: boolean }>({
    url: webConfigStatics.api.routes.questMerge.replace(':questId', questId),
    body: undefined,
  });
