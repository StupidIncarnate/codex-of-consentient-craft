/**
 * PURPOSE: Sends structured clarification answers for an existing quest by POSTing to the per-quest clarify endpoint
 *
 * USAGE:
 * const { chatProcessId } = await questClarifyBroker({ questId, answers, questions });
 * // Returns { chatProcessId: ProcessId }
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { AskUserQuestionItem, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questClarifyBroker = async ({
  questId,
  answers,
  questions,
}: {
  questId: QuestId;
  answers: { header: string; label: string }[];
  questions: AskUserQuestionItem[];
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questClarify.replace(':questId', questId);

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body: { answers, questions },
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
