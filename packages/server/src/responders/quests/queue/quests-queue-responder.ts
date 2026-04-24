/**
 * PURPOSE: Handles GET /api/quests/queue requests by delegating to the orchestrator adapter to return the current cross-guild execution queue snapshot
 *
 * USAGE:
 * const result = await QuestsQueueResponder();
 * // Returns { status: 200, data: { entries: QuestQueueEntry[] } } or { status: 500, data: { error } }
 */

import { orchestratorGetQuestQueueAdapter } from '../../../adapters/orchestrator/get-quest-queue/orchestrator-get-quest-queue-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestsQueueResponder = async (): Promise<ResponderResult> => {
  try {
    const entries = await Promise.resolve(orchestratorGetQuestQueueAdapter());
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { entries },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read quest queue';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
