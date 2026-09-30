/**
 * PURPOSE: Defines the data `ArrayEntryLineParseLayerResponder` returns
 *
 * USAGE:
 * arrayEntryLineParseLayerResultContract.parse(value);
 * // Returns validated ArrayEntryLineParseLayerResult
 */
import { z } from '#gateway/npm/zod';

export const arrayEntryLineParseLayerResultContract = z
  .object({
    entries: z
      .array(
        z
          .object({
            value: z.string().brand<'ArrayEntryLineParseLayerResultEntriesValue'>(),
            start: z.number().brand<'ArrayEntryLineParseLayerResultEntriesStart'>(),
            end: z.number().brand<'ArrayEntryLineParseLayerResultEntriesEnd'>(),
            quoteChar: z.string().brand<'ArrayEntryLineParseLayerResultEntriesQuoteChar'>(),
          })
          .brand<'ArrayEntryLineParseLayerResultEntries'>(),
      )
      .readonly(),
  })
  .brand<'ArrayEntryLineParseLayerResult'>();

export type ArrayEntryLineParseLayerResult = z.infer<typeof arrayEntryLineParseLayerResultContract>;
