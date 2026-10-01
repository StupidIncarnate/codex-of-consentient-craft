/**
 * PURPOSE: Sends structured clarification answers for an existing quest by POSTing to the per-quest clarify endpoint
 *
 * USAGE:
 * const { chatProcessId } = await questClarifyBroker({ questId, answers, questions });
 * // Returns { chatProcessId: ProcessId }
 */

import { questClarifyResultContract } from '../../../contracts/quest-clarify-result/quest-clarify-result-contract';
import type { QuestClarifyResult } from '../../../contracts/quest-clarify-result/quest-clarify-result-contract';
import type {
  AskUserQuestionItem,
  PastedImageUpload,
  Quest,
} from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questClarifyBroker = async ({
  questId,
  answers,
  questions,
}: {
  questId: Quest['id'];
  answers: {
    header: string;
    labels: string[];
    text?: string;
    images?: readonly PastedImageUpload[];
  }[];
  questions: AskUserQuestionItem[];
}): Promise<QuestClarifyResult> => {
  const url = webConfigStatics.api.routes.questClarify.replace(':questId', questId);

  const response = await fetchJson({
    url,
    method: 'POST',
    body: { answers, questions },
  });

  return questClarifyResultContract.parse(response);
};
