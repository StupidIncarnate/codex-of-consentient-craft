/**
 * PURPOSE: The one declaration of the health-status heartbeat body, shared by the server that emits
 * it every 10 seconds (and returns it from GET /api/health/status) and the web channel that parses
 * each delivered frame. Reach for this over the server's healthResponseContract — that one already
 * brands 'HealthStatus' onto a plain non-empty string for the bare /api/health liveness probe, and a
 * schema needing status alongside uptime and version cannot reuse that tag on a different base shape.
 *
 * USAGE:
 * healthStatusPayloadContract.parse({status: 'ok', uptimeSeconds: 11520, version: '0.1.0'});
 * // Returns: HealthStatusPayload
 */

import { z } from 'zod';

export const healthStatusPayloadContract = z.object({
  status: z.enum(['ok', 'degraded']).brand<'HealthStatusValue'>(),
  uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>(),
  version: z.string().min(1).brand<'ServerVersion'>(),
});

export type HealthStatusPayload = z.infer<typeof healthStatusPayloadContract>;
