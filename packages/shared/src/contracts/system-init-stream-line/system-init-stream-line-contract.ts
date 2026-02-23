/**
 * PURPOSE: Validates the shape of a JSONL stream line for system init events
 *
 * USAGE:
 * const parsed = systemInitStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates system init messages that carry a session ID
 */
import { z } from 'zod';

export const systemInitStreamLineContract = z.object({
  type: z.literal('system'),
  subtype: z.literal('init'),
  session_id: z.string().brand<'SessionId'>(),
});

export type SystemInitStreamLine = z.infer<typeof systemInitStreamLineContract>;
