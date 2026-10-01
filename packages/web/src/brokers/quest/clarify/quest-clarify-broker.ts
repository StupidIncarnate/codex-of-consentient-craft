/**
 * PURPOSE: Sends structured clarification answers for an existing quest by POSTing to the per-quest
 * clarify endpoint. A refused POST rejects with the server's own `error` text, so the clarify panel
 * can show why instead of a generic "failed with status 400".
 *
 * USAGE:
 * const { chatProcessId } = await questClarifyBroker({ questId, answers, questions });
 * // Returns { chatProcessId: ProcessId }; throws the server's exact refusal text otherwise
 */

import { questClarifyErrorContract } from '../../../contracts/quest-clarify-error/quest-clarify-error-contract';
import { questClarifyResultContract } from '../../../contracts/quest-clarify-result/quest-clarify-result-contract';
import type { QuestClarifyResult } from '../../../contracts/quest-clarify-result/quest-clarify-result-contract';
import type {
  AskUserQuestionItem,
  PastedImageUpload,
  Quest,
} from '@dungeonmaster/shared/contracts';

import { fetchWithStatus } from '#gateway/browser/fetch';

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

  const result = await fetchWithStatus({
    url,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { answers, questions },
  });

  // `fetchWithStatus` hands back the raw response text; a body that is not JSON parses as itself,
  // which the contracts then reject.
  const parsedBody = ((): unknown => {
    try {
      return JSON.parse(result.body);
    } catch {
      return result.body;
    }
  })();

  if (result.ok) {
    return questClarifyResultContract.parse(parsedBody);
  }

  const refusal = questClarifyErrorContract.safeParse(parsedBody);
  if (refusal.success && refusal.data.error !== undefined) {
    throw new Error(refusal.data.error);
  }
  throw new Error(`POST ${url} failed with status ${result.status}`);
};
