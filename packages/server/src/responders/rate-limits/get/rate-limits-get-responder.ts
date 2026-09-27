/**
 * PURPOSE: Handles GET /api/rate-limits requests by delegating to `StartOrchestrator.getRateLimits`
 * to return the latest 5h/7d snapshot
 *
 * USAGE:
 * const result = await RateLimitsGetResponder();
 * // Returns { status: 200, data: { snapshot: RateLimitsSnapshot | null } } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const RateLimitsGetResponder = async (): Promise<ResponderResult> => {
  try {
    const snapshot = await StartOrchestrator.getRateLimits();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { snapshot },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read rate limits';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
