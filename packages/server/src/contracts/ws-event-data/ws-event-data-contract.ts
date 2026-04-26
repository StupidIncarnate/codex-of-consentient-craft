/**
 * PURPOSE: Defines the validated shape of a WebSocket message-event object's `data` field
 *
 * USAGE:
 * const { data } = wsEventDataContract.parse(evt);
 * // Returns: { data: unknown }
 */

import { z } from 'zod';

export const wsEventDataContract = z.object({
  data: z.unknown(),
});

export type WsEventData = z.infer<typeof wsEventDataContract>;
