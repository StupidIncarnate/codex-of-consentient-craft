/**
 * PURPOSE: Handles POST /api/orchestration/dispatch/play — starts the Node dispatcher via the
 * orchestrator adapter and returns the persisted state.
 *
 * USAGE:
 * const result = await OrchestrationDispatchPlayResponder();
 * // Returns { status: 200, data: { state } } or { status: 500, data: { error } }
 */

import { orchestratorPlayDispatchAdapter } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const OrchestrationDispatchPlayResponder = async (): Promise<ResponderResult> => {
  try {
    const state = await orchestratorPlayDispatchAdapter();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { state },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to play dispatch';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
