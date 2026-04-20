/**
 * PURPOSE: Handles quest resume requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestResumeResponder({ params: { questId: 'abc' } });
 * // Returns { status: 200, data: { resumed: true, restoredStatus: 'seek_scope' } } or { status: 400/500, data: { error } }
 */

import { questIdContract } from '@dungeonmaster/shared/contracts';
import { isQuestResumableQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorResumeQuestAdapter } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestResumeResponder = async ({
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

    const questResult = await orchestratorGetQuestAdapter({ questId: questIdRaw });
    if (!questResult.success || !questResult.quest) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Quest not found' },
      });
    }

    const { quest } = questResult;
    if (!isQuestResumableQuestStatusGuard({ status: quest.status })) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: {
          error: 'Quest must be in a resumable status (paused or blocked) to resume',
        },
      });
    }

    const result = await orchestratorResumeQuestAdapter({ questId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to resume quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
