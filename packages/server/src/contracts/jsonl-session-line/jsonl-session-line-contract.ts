/**
 * PURPOSE: Defines the validated shape of a session JSONL line for summary extraction
 *
 * USAGE:
 * const parsed = jsonlSessionLineContract.parse(JSON.parse(line));
 * // Returns: { type?, summary?, slug?, isMeta?, message? }
 */

import { z } from '#gateway/npm/zod';

export const jsonlSessionLineContract = z
  .object({
    type: z.string().min(1).brand<'JsonlSessionLineType'>().optional(),
    summary: z.string().min(1).brand<'JsonlSessionLineSummary'>().optional(),
    slug: z.string().min(1).brand<'JsonlSessionLineSlug'>().optional(),
    isMeta: z.boolean().optional(),
    message: z
      .object({
        content: z.string().min(1).brand<'JsonlSessionLineMessageContent'>().optional(),
      })
      .brand<'JsonlSessionLineMessage'>()
      .loose()
      .optional(),
  })
  .loose()
  .brand<'JsonlSessionLine'>();

export type JsonlSessionLine = z.infer<typeof jsonlSessionLineContract>;
