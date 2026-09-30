/**
 * PURPOSE: Handles GET /api/quests/queue requests by delegating to `StartOrchestrator.getExecutionQueue`
 * to return the current cross-guild execution queue snapshot
 *
 * USAGE:
 * const result = await QuestsQueueResponder();
 * // Returns { status: 200, data: { entries: QuestQueueEntry[] } } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { questsQueueResponseDataContract } from '../../../contracts/quests-queue-response-data/quests-queue-response-data-contract';

export const QuestsQueueResponder = async (): Promise<ResponderResult> => {
  try {
    const entries = await StartOrchestrator.getExecutionQueue();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: questsQueueResponseDataContract.parse({ entries }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read quest queue';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
