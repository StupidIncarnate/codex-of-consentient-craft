/**
 * PURPOSE: Handles GET /api/orchestration/mode requests by delegating to the orchestrator adapter to
 * return the declared orchestrationMode (claude | node) from `.dungeonmaster.json`
 *
 * USAGE:
 * const result = await OrchestrationModeGetResponder();
 * // Returns { status: 200, data: { mode } } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { orchestrationModeGetResponseDataContract } from '../../../contracts/orchestration-mode-get-response-data/orchestration-mode-get-response-data-contract';

export const OrchestrationModeGetResponder = async (): Promise<ResponderResult> => {
  try {
    const mode = await StartOrchestrator.getOrchestrationMode();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: orchestrationModeGetResponseDataContract.parse({ mode }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read orchestration mode';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
