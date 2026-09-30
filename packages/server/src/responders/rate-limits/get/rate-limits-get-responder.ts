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
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { rateLimitsGetResponseDataContract } from '../../../contracts/rate-limits-get-response-data/rate-limits-get-response-data-contract';

export const RateLimitsGetResponder = async (): Promise<ResponderResult> => {
  try {
    const snapshot = await StartOrchestrator.getRateLimits();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: rateLimitsGetResponseDataContract.parse({ snapshot }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read rate limits';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
