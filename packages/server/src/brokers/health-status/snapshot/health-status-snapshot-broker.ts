/**
 * PURPOSE: The single producer of a HealthStatusPayload in packages/server. Reach for this over
 * building {status, uptimeSeconds, version} inline at a call site — the seed route and the
 * heartbeat both need the identical shape, and this is what keeps them from drifting apart into
 * two hand-written object literals.
 *
 * USAGE:
 * healthStatusSnapshotBroker();
 * // Returns HealthStatusPayload, freshly built on every call
 */
import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts';
import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

import { processUptimeAdapter } from '../../../adapters/process/uptime/process-uptime-adapter';
import { serverVersionReadAdapter } from '../../../adapters/server-version/read/server-version-read-adapter';

export const healthStatusSnapshotBroker = (): HealthStatusPayload =>
  healthStatusPayloadContract.parse({
    status: 'ok',
    uptimeSeconds: processUptimeAdapter(),
    version: serverVersionReadAdapter(),
  });
