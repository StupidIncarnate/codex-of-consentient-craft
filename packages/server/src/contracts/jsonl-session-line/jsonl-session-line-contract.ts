/**
 * PURPOSE: Defines the validated shape of a session JSONL line for summary extraction
 *
 * USAGE:
 * const parsed = jsonlSessionLineContract.parse(JSON.parse(line));
 * // Returns: { type?, summary?, slug?, isMeta?, message? }
 */

import { z } from 'zod';

export const jsonlSessionLineContract = z
  .object({
    type: z.string().min(1).brand<'JsonlLineType'>().optional(),
    summary: z.string().min(1).brand<'JsonlLineSummary'>().optional(),
    slug: z.string().min(1).brand<'JsonlLineSlug'>().optional(),
    isMeta: z.boolean().optional(),
    message: z
      .object({
        content: z.string().min(1).brand<'JsonlMessageContent'>().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type JsonlSessionLine = z.infer<typeof jsonlSessionLineContract>;
