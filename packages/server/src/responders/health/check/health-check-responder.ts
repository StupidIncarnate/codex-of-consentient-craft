/**
 * PURPOSE: Owns the HTTP verdict for GET /api/health, so the snapshot assembly beneath it stays a
 * pure broker with no status codes in it. Reach for this rather than calling healthSnapshotBroker
 * from the flow directly: assembly reads a manifest off disk, resolves a home dir and asks the
 * orchestrator for its mode, and the web badge keys OFFLINE off the status code that failing
 * produces, so the translation needs a named home.
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
