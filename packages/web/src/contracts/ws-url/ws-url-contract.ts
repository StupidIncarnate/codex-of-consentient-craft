/**
 * PURPOSE: Branded WebSocket URL string used by the shared web-socket-channel middleware to address the backend /ws endpoint
 *
 * USAGE:
 * wsUrlContract.parse(`ws://${globalThis.location.host}/ws`);
 * // Returns WsUrl
 */

import { z } from 'zod';

export const wsUrlContract = z
  .string()
  .regex(/^wss?:\/\/.+/u, 'must start with ws:// or wss://')
  .brand<'WsUrl'>();

export type WsUrl = z.infer<typeof wsUrlContract>;
