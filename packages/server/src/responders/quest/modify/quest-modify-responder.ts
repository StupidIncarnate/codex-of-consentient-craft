/**
 * PURPOSE: Handles quest modification requests by validating params/body against
 * `modifyQuestInputContract` and delegating to `StartOrchestrator.modifyQuest`
 *
 * USAGE:
 * const result = await QuestModifyResponder({ params: { questId: 'abc' }, body: { status: 'approved' } });
 * // Returns { status: 200, data: result } or { status: 400/500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import {
  modifyQuestInputContract,
  modifyQuestResultContract,
} from '@dungeonmaster/shared/contracts';

import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';

export const QuestModifyResponder = async ({
  params,
  body,
}: {
  params: unknown;
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Invalid params' }),
      });
    }
    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'questId is required' }),
      });
    }
    const { questId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Request body must be a JSON object' }),
      });
    }

    // questId always comes from the URL, never the body — spread body FIRST so the real one wins
    // over anything a caller happened to send under that key.
    const parsedInput = modifyQuestInputContract.safeParse({ ...body, questId });
    if (!parsedInput.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({
          error: parsedInput.error.issues[0]?.message ?? 'Invalid modify-quest input',
        }),
      });
    }

    const result = await StartOrchestrator.modifyQuest({
      questId,
      input: parsedInput.data,
    });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: modifyQuestResultContract.parse(result),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to modify quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
