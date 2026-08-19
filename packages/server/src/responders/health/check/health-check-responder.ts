/**
 * PURPOSE: Gives GET /api/health an error path — until now the route was an inline c.json literal
 * that could never fail, so a broken snapshot assembly (bad version manifest, unreadable home dir)
 * surfaced as a 200 with malformed data instead of a status code the web badge can key off.
 *
 * USAGE:
 * const result = await HealthCheckResponder();
 * // Returns { status: 200, data: <HealthSnapshot> } or { status: 500, data: { error } }
 */

import { healthSnapshotBroker } from '../../../brokers/health/snapshot/health-snapshot-broker';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const HealthCheckResponder = async (): Promise<ResponderResult> => {
  try {
    const snapshot = await healthSnapshotBroker();
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: snapshot,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to assemble health snapshot';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
