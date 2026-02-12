/**
 * PURPOSE: Modifies an existing quest by sending a PATCH request with modifications to the API
 *
 * USAGE:
 * const updated = await questModifyBroker({questId, modifications: {title: 'New Title'}});
 * // Returns updated Quest object
 */
import { questContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPatchAdapter } from '../../../adapters/fetch/patch/fetch-patch-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questModifyBroker = async ({
  questId,
  modifications,
}: {
  questId: QuestId;
  modifications: Record<string, unknown>;
}): Promise<Quest> => {
  const response = await fetchPatchAdapter<unknown>({
    url: webConfigStatics.api.routes.questById.replace(':questId', questId),
    body: modifications,
  });

  return questContract.parse(response);
};
