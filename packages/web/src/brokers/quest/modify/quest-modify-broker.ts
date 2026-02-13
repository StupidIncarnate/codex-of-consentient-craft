/**
 * PURPOSE: Modifies an existing quest by sending a PATCH request with modifications to the API
 *
 * USAGE:
 * await questModifyBroker({questId, modifications: {title: 'New Title'}});
 * // Returns void on success, throws on failure
 */
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPatchAdapter } from '../../../adapters/fetch/patch/fetch-patch-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questModifyBroker = async ({
  questId,
  modifications,
}: {
  questId: QuestId;
  modifications: Record<string, unknown>;
}): Promise<void> => {
  const response = await fetchPatchAdapter<unknown>({
    url: webConfigStatics.api.routes.questById.replace(':questId', questId),
    body: modifications,
  });

  if (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    Reflect.get(response, 'success') === false
  ) {
    const errorValue = 'error' in response ? Reflect.get(response, 'error') : undefined;
    throw new Error(
      errorMessageContract.parse(
        typeof errorValue === 'string' ? errorValue : 'Quest modification failed',
      ),
    );
  }
};
