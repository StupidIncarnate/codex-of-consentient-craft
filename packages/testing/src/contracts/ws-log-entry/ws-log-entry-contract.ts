/**
 * PURPOSE: Zod schema for WebSocket message log entry used in network recording
 *
 * USAGE:
 * wsLogEntryContract.parse({direction: 'received', data: '{"type":"chat"}', elapsedMs: 45});
 * // Returns validated WsLogEntry type
 */

import { z } from '#gateway/npm/zod';

export const wsLogEntryContract = z.object({
  direction: z.enum(['sent', 'received']),
  data: z.string().brand<'WsLogEntryData'>(),
  elapsedMs: z.number().nonnegative().brand<'WsLogEntryElapsedMs'>(),
}).brand<'WsLogEntry'>();

export type WsLogEntry = z.infer<typeof wsLogEntryContract>;
