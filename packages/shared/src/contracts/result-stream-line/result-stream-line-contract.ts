/**
 * PURPOSE: Validates the shape of a JSONL stream line for result events
 *
 * USAGE:
 * const parsed = resultStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates result messages carrying session cost, duration, and turn count
 */
import { z } from '#gateway/npm/zod';
import { sessionContract } from '../session/session-contract';

export const resultStreamLineContract = z.object({
  type: z.literal('result'),
  session_id: sessionContract.shape.id,
  cost_usd: z.number().brand<'CostUsd'>().optional(),
  duration_ms: z.number().brand<'DurationMs'>().optional(),
  num_turns: z.number().brand<'NumTurns'>().optional(),
});

export type ResultStreamLine = z.infer<typeof resultStreamLineContract>;
