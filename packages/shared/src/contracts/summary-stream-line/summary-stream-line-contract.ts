/**
 * PURPOSE: Validates the shape of a JSONL stream line for summary events
 *
 * USAGE:
 * const parsed = summaryStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates summary messages carrying a human-readable summary of the session
 */
import { z } from 'zod';

export const summaryStreamLineContract = z.object({
  type: z.literal('summary'),
  summary: z.string().brand<'SummaryText'>(),
});

export type SummaryStreamLine = z.infer<typeof summaryStreamLineContract>;
