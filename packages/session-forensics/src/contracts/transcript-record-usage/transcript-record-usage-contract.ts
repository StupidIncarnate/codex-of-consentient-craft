/**
 * PURPOSE: The token counts a transcript assistant record's `message.usage` reports, each key
 * optional because Claude Code adds and omits keys between releases. Reach for this over
 * `tokenUsageContract` when reading the raw snake_case record; `tokenUsageContract` is the settled
 * camelCase shape with every count defaulted to 0.
 *
 * USAGE:
 * transcriptRecordUsageContract.parse({ input_tokens: 2, output_tokens: 239 });
 * // Returns a branded TranscriptRecordUsage; keys Claude Code did not report stay absent
 * // and unknown keys are dropped.
 */
import { z } from '#gateway/npm/zod';

export const transcriptRecordUsageContract = z
  .object({
    input_tokens: z.number().brand<'TranscriptRecordUsageInputTokens'>().optional(),
    output_tokens: z.number().brand<'TranscriptRecordUsageOutputTokens'>().optional(),
    cache_read_input_tokens: z
      .number()
      .brand<'TranscriptRecordUsageCacheReadInputTokens'>()
      .optional(),
    cache_creation_input_tokens: z
      .number()
      .brand<'TranscriptRecordUsageCacheCreationInputTokens'>()
      .optional(),
    output_tokens_details: z
      .object({
        thinking_tokens: z
          .number()
          .brand<'TranscriptRecordUsageOutputTokensDetailsThinkingTokens'>()
          .optional(),
      })
      .brand<'TranscriptRecordUsageOutputTokensDetails'>()
      .optional(),
  })
  .brand<'TranscriptRecordUsage'>();

export type TranscriptRecordUsage = z.infer<typeof transcriptRecordUsageContract>;
