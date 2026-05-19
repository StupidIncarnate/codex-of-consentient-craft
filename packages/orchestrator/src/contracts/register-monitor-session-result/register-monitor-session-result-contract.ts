/**
 * PURPOSE: Defines the acknowledgment shape returned by registerMonitorSessionBroker to the MCP tool that called it (which relays it back to the /dumpster-launch LLM)
 *
 * USAGE:
 * registerMonitorSessionResultContract.parse({ status: 'registered', orphansReset: 3 });
 * // Returns: RegisterMonitorSessionResult — small ack the LLM can read to confirm registration succeeded
 */

import { z } from 'zod';

export const registerMonitorSessionResultContract = z.object({
  status: z.literal('registered'),
  orphansReset: z.number().int().nonnegative().brand<'OrphansResetCount'>(),
});

export type RegisterMonitorSessionResult = z.infer<typeof registerMonitorSessionResultContract>;
