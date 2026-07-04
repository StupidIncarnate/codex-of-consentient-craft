/**
 * PURPOSE: Handles POST /api/orchestration/dispatch/pause — gracefully pauses the Node
 * dispatcher via the orchestrator adapter and returns the persisted state.
 *
 * USAGE:
 * const result = await OrchestrationDispatchPauseResponder();
 * // Returns { status: 200, data: { state } } or { status: 500, data: { error } }
 */

import { orchestratorPauseDispatchAdapter } from '../../../adapters/orchestrator/pause-dispatch/orchestrator-pause-dispatch-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const OrchestrationDispatchPauseResponder = async (): Promise<ResponderResult> => {
  try {
    const state = await orchestratorPauseDispatchAdapter();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { state },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to pause dispatch';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
