/**
 * PURPOSE: Handles GET /api/health/status by returning the current health reading, the same
 * HealthStatusPayload every heartbeat frame carries — so the badge's mount-time seed and its
 * next heartbeat never disagree.
 *
 * USAGE:
 * const result = HealthStatusResponder();
 * // Returns { status: 200, data: HealthStatusPayload } or { status: 500, data: { error } }
 */

import { healthStatusBroker } from '../../../brokers/health/status/health-status-broker';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const HealthStatusResponder = (): ResponderResult => {
  try {
    const payload = healthStatusBroker();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: payload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read health status';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
