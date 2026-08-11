/**
 * PURPOSE: Sends a message to the tavernkeeper in the FOLLOW-UP tab of a finished quest. Reach
 * for this over questChatBroker because the FOLLOW-UP tab stays open across visits — if the quest
 * has moved back to in_progress or merging since the tab was loaded, the server's 400 rejection
 * text must render verbatim in the tab, not a generic "failed with status 400".
 *
 * USAGE:
 * const { chatProcessId } = await questFollowupBroker({ questId, message });
 * // Returns { chatProcessId } on success; throws the server's exact rejection text otherwise
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId, UserInput } from '@dungeonmaster/shared/contracts';

import { fetchPostWithStatusAdapter } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter';
import { questFollowupResponseContract } from '../../../contracts/quest-followup-response/quest-followup-response-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questFollowupBroker = async ({
  questId,
  message,
}: {
  questId: QuestId;
  message: UserInput;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questFollowup.replace(':questId', questId);

  const result = await fetchPostWithStatusAdapter({ url, body: { message } });
  const parsed = questFollowupResponseContract.safeParse(result.body);

  if (result.ok) {
    if (parsed.success && parsed.data.chatProcessId !== undefined) {
      return { chatProcessId: processIdContract.parse(parsed.data.chatProcessId) };
    }
    // A 200 carrying no usable chatProcessId is a broken server contract, not a success.
    throw new Error(`POST ${url} returned 200 with no chatProcessId`);
  }

  if (parsed.success && parsed.data.error !== undefined) {
    throw new Error(parsed.data.error);
  }
  throw new Error(`POST ${url} failed with status ${result.status}`);
};
