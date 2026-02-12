/**
 * PURPOSE: Verifies quest structure integrity by posting to the verify API endpoint
 *
 * USAGE:
 * const result = await questVerifyBroker({questId});
 * // Returns QuestVerifyResult with success flag and check details
 */
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import type { QuestVerifyResult } from '../../../contracts/quest-verify-result/quest-verify-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questVerifyBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestVerifyResult> =>
  fetchPostAdapter<QuestVerifyResult>({
    url: webConfigStatics.api.routes.questVerify.replace(':questId', questId),
    body: {},
  });
