/**
 * PURPOSE: Builds the one HealthStatusPayload both the seed route and every heartbeat frame read,
 * so the badge's three keys come from a single call site rather than being assembled twice and
 * risking drift between the two surfaces.
 *
 * USAGE:
 * const payload = healthStatusBroker();
 * // Returns HealthStatusPayload — status is always 'ok', uptimeSeconds is process.uptime() floored
 */
import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts';
import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

import { serverPackageVersionAdapter } from '../../../adapters/server-package/version/server-package-version-adapter';

export const healthStatusBroker = (): HealthStatusPayload =>
  healthStatusPayloadContract.parse({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    version: serverPackageVersionAdapter(),
  });
