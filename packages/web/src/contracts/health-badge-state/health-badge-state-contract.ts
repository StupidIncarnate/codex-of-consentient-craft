/**
 * PURPOSE: Declares what the health badge is currently rendering — one of checking, online,
 * degraded or offline — as a discriminated union, so a stale uptimeSeconds or offlineCause is
 * absent from the parsed object rather than merely unset. Reach for this over
 * healthStatusPayloadContract when the shape crossing a boundary is the badge's OWN rendered
 * state rather than the wire body a seed response or heartbeat frame carries.
 *
 * USAGE:
 * healthBadgeStateContract.parse({ state: 'online', uptimeSeconds: 11520 });
 * // Returns HealthBadgeState — the online branch, with no offlineCause or offlineStatusCode key
 */

import { z } from 'zod';

import { httpStatusStatics } from '../../statics/http-status/http-status-statics';

export const healthBadgeStateContract = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('checking'),
  }),
  z.object({
    state: z.literal('online'),
    uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>(),
    lastHeartbeatAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  }),
  z.object({
    state: z.literal('degraded'),
    lastHeartbeatAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  }),
  z.object({
    state: z.literal('offline'),
    offlineCause: z.enum(['unreachable', 'server-error', 'silence']),
    offlineStatusCode: z
      .number()
      .int()
      .min(httpStatusStatics.range.min)
      .max(httpStatusStatics.range.max)
      .brand<'HttpStatusCode'>()
      .optional(),
    lastHeartbeatAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  }),
]);

export type HealthBadgeState = z.infer<typeof healthBadgeStateContract>;
