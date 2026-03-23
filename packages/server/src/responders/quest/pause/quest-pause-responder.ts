/**
 * PURPOSE: Handles quest pause requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestPauseResponder({ params: { questId: 'abc' } });
 * // Returns { status: 200, data: { paused: true } } or { status: 400/500, data: { error } }
 */

import { questIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorPauseQuestAdapter } from '../../../adapters/orchestrator/pause-quest/orchestrator-pause-quest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestPauseResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }
    const questIdRaw: unknown = Reflect.get(params, 'questId');
    if (typeof questIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }
    const questId = questIdContract.parse(questIdRaw);
    const result = await orchestratorPauseQuestAdapter({ questId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to pause quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
