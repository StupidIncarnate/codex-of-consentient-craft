/**
 * PURPOSE: Zod schema for Antigravity transcript JSONL line
 *
 * USAGE:
 * const line = agyTranscriptLineContract.parse(data);
 * // Returns validated AgyTranscriptLine
 */

import { z } from 'zod';

export const agyTranscriptLineContract = z
  .object({
    tool_calls: z
      .array(
        z.object({
          name: z.string().optional(),
          args: z.record(z.unknown()).optional(),
        }),
      )
      .optional(),
  })
  .brand<'AgyTranscriptLine'>();

export type AgyTranscriptLine = z.infer<typeof agyTranscriptLineContract>;
