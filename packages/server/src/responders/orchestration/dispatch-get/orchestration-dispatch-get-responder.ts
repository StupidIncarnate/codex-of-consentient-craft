/**
 * PURPOSE: Handles GET /api/orchestration/dispatch requests by delegating to the orchestrator
 * adapter to return the Node dispatcher's play/pause state
 *
 * USAGE:
 * const result = await OrchestrationDispatchGetResponder();
 * // Returns { status: 200, data: { state } } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const OrchestrationDispatchGetResponder = async (): Promise<ResponderResult> => {
  try {
    const state = await StartOrchestrator.getDispatchState();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { state },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read dispatch state';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
