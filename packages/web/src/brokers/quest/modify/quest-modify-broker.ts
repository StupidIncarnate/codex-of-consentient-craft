/**
 * PURPOSE: Modifies an existing quest by sending a PATCH request with modifications to the API
 *
 * USAGE:
 * await questModifyBroker({questId, modifications: {title: 'New Title'}});
 * // Returns void on success, throws on failure
 */
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questModifyResponseContract } from '../../../contracts/quest-modify-response/quest-modify-response-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questModifyBroker = async ({
  questId,
  modifications,
}: {
  questId: QuestId;
  modifications: Record<string, unknown>;
}): Promise<void> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.questById.replace(':questId', questId),
    method: 'PATCH',
    body: modifications,
  });

  const parsedResponse = questModifyResponseContract.safeParse(response);
  if (parsedResponse.success && !parsedResponse.data.success) {
    const errorValue = parsedResponse.data.error;
    throw new Error(
      errorMessageContract.parse(
        typeof errorValue === 'string' && errorValue.length > 0
          ? errorValue
          : 'Quest modification failed',
      ),
    );
  }
};
