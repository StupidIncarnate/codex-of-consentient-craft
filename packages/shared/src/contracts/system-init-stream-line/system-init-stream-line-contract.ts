/**
 * PURPOSE: Validates the shape of a JSONL stream line for system init events
 *
 * USAGE:
 * const parsed = systemInitStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates system init messages that carry a session ID
 */
import { z } from '#gateway/npm/zod';
import { sessionContract } from '../session/session-contract';

export const systemInitStreamLineContract = z.object({
  type: z.literal('system'),
  subtype: z.literal('init'),
  session_id: sessionContract.shape.id,
});

export type SystemInitStreamLine = z.infer<typeof systemInitStreamLineContract>;
