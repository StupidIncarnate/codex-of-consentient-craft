/**
 * PURPOSE: Defines the data `ArrayEntryAnchorInsertLayerResponder` returns
 *
 * USAGE:
 * arrayEntryAnchorInsertLayerResultContract.parse(value);
 * // Returns validated ArrayEntryAnchorInsertLayerResult
 */
import { z } from '#gateway/npm/zod';

export const arrayEntryAnchorInsertLayerResultContract = z
  .object({
    content: z.string().brand<'ArrayEntryAnchorInsertLayerResultContent'>(),
    inserted: z.boolean(),
    alreadyPresent: z.boolean(),
    matchedEntryValue: z
      .string()
      .brand<'ArrayEntryAnchorInsertLayerResultMatchedEntryValue'>()
      .optional(),
  })
  .brand<'ArrayEntryAnchorInsertLayerResult'>();

export type ArrayEntryAnchorInsertLayerResult = z.infer<
  typeof arrayEntryAnchorInsertLayerResultContract
>;
