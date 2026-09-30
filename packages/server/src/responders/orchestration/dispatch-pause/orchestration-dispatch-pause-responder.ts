/**
 * PURPOSE: Handles POST /api/orchestration/dispatch/pause — gracefully pauses the Node
 * dispatcher via the orchestrator adapter and returns the persisted state.
 *
 * USAGE:
 * const result = await OrchestrationDispatchPauseResponder();
 * // Returns { status: 200, data: { state } } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { orchestrationDispatchPauseResponseDataContract } from '../../../contracts/orchestration-dispatch-pause-response-data/orchestration-dispatch-pause-response-data-contract';

export const OrchestrationDispatchPauseResponder = async (): Promise<ResponderResult> => {
  try {
    const state = await StartOrchestrator.pauseDispatch();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: orchestrationDispatchPauseResponseDataContract.parse({ state }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to pause dispatch';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
