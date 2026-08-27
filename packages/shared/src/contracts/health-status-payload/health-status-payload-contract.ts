/**
 * PURPOSE: The body of a health-status heartbeat frame and of the GET /api/health/status seed
 * response — the one schema both sides of the wire agree on. Reach for this over the server's own
 * health-response-contract's `HealthStatus` brand (a bare liveness-probe string with no uptime or
 * version): that brand tag is already taken there, shared cannot import server to reuse its type,
 * and zod brands are structural, so a shared brand of the same name would make the two
 * interchangeable.
 *
 * USAGE:
 * healthStatusPayloadContract.parse({status: 'ok', uptimeSeconds: 120, version: '1.0.0'});
 * // Returns: HealthStatusPayload
 */
import { z } from 'zod';

export const healthStatusPayloadContract = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>(),
  version: z.string().min(1).brand<'ServerVersion'>(),
});

export type HealthStatusPayload = z.infer<typeof healthStatusPayloadContract>;
