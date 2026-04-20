/**
 * PURPOSE: Resumes a paused quest by sending a POST request to the quest resume API endpoint
 *
 * USAGE:
 * await questResumeBroker({questId});
 * // Returns {resumed: true, restoredStatus: QuestStatus} on success, throws on failure
 */

import type { QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questResumeBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ resumed: boolean; restoredStatus: QuestStatus }> =>
  fetchPostAdapter<{ resumed: boolean; restoredStatus: QuestStatus }>({
    url: webConfigStatics.api.routes.questResume.replace(':questId', questId),
    body: {},
  });
