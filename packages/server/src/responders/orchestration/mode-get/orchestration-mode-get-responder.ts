/**
 * PURPOSE: Handles GET /api/orchestration/mode requests by delegating to the orchestrator adapter to
 * return the declared orchestrationMode (claude | node) from `.dungeonmaster.json`
 *
 * USAGE:
 * const result = await OrchestrationModeGetResponder();
 * // Returns { status: 200, data: { mode } } or { status: 500, data: { error } }
 */

import { orchestratorGetOrchestrationModeAdapter } from '../../../adapters/orchestrator/get-orchestration-mode/orchestrator-get-orchestration-mode-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const OrchestrationModeGetResponder = async (): Promise<ResponderResult> => {
  try {
    const mode = await orchestratorGetOrchestrationModeAdapter();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { mode },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read orchestration mode';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
