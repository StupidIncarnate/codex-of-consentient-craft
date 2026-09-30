/**
 * PURPOSE: Handles POST /api/orchestration/dispatch/play — starts the Node dispatcher via
 * `StartOrchestrator.playDispatch` and returns the persisted state.
 *
 * USAGE:
 * const result = await OrchestrationDispatchPlayResponder();
 * // Returns { status: 200, data: { state } } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { orchestrationDispatchPlayResponseDataContract } from '../../../contracts/orchestration-dispatch-play-response-data/orchestration-dispatch-play-response-data-contract';

export const OrchestrationDispatchPlayResponder = async (): Promise<ResponderResult> => {
  try {
    const state = await StartOrchestrator.playDispatch();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: orchestrationDispatchPlayResponseDataContract.parse({ state }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to play dispatch';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
