/**
 * PURPOSE: Zod schema for Antigravity transcript JSONL line
 *
 * USAGE:
 * const line = agyTranscriptLineContract.parse(data);
 * // Returns validated AgyTranscriptLine
 */

import { z } from '#gateway/npm/zod';

export const agyTranscriptLineContract = z
  .object({
    tool_calls: z
      .array(
        z.object({
          name: z.string().brand<'AgyTranscriptLineToolCallsName'>().optional(),
          args: z.record(z.string().brand<'AgyTranscriptLineToolCallsArgsKey'>(), z.unknown()).optional(),
        }).brand<'AgyTranscriptLineToolCalls'>(),
      )
      .optional(),
  })
  .brand<'AgyTranscriptLine'>();

export type AgyTranscriptLine = z.infer<typeof agyTranscriptLineContract>;
