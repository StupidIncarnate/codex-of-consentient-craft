/**
 * PURPOSE: The seed endpoint handler for GET /api/health/status. Flows may not import brokers
 * directly, so this is the boundary that reaches healthStatusSnapshotBroker on the route's behalf,
 * and where a broker failure becomes an ordinary HTTP answer instead of crashing the request.
 *
 * USAGE:
 * const result = HealthStatusResponder();
 * // health-flow.ts hands result.data straight to c.json
 */

import { healthStatusSnapshotBroker } from '../../../brokers/health-status/snapshot/health-status-snapshot-broker';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const HealthStatusResponder = (): ResponderResult => {
  try {
    const data = healthStatusSnapshotBroker();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read health status';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
