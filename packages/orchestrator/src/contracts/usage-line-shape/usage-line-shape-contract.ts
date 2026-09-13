/**
 * PURPOSE: The narrow slice of a Claude transcript line the usage scan reads — the timestamp and
 *   the four token counts, and nothing else. Reach for this over assistantStreamLineContract,
 *   which models the message CONTENT for rendering: this one exists to be cheap and forgiving over
 *   a 1.8 GB tree, so it describes the two fields the measurement needs and ignores every other
 *   shape difference between CLI versions.
 *
 * USAGE:
 * usageLineShapeContract.safeParse(JSON.parse(rawLine));
 * // Returns a zod result; `.success` is false for every line that records no spend
 */

import { z } from 'zod';

const rawTokenCountContract = z.number().int().min(0).brand<'TokenCount'>();

export const usageLineShapeContract = z.object({
  timestamp: z.string().min(1).brand<'IsoTimestamp'>(),
  message: z.object({
    // Every field is optional because the CLI omits a count rather than sending zero, and the set
    // has grown across releases. A line whose `usage` object is present but empty is still a real
    // assistant turn that happened to spend nothing measurable.
    usage: z.object({
      input_tokens: rawTokenCountContract.nullish(),
      cache_creation_input_tokens: rawTokenCountContract.nullish(),
      cache_read_input_tokens: rawTokenCountContract.nullish(),
      output_tokens: rawTokenCountContract.nullish(),
    }),
  }),
});

export type UsageLineShape = z.infer<typeof usageLineShapeContract>;
