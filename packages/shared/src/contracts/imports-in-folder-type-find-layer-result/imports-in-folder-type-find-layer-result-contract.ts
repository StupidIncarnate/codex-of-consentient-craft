/**
 * PURPOSE: Defines the data `importsInFolderTypeFindLayerBroker` returns
 *
 * USAGE:
 * importsInFolderTypeFindLayerResultContract.parse(value);
 * // Returns validated ImportsInFolderTypeFindLayerResult
 */
import { z } from '#gateway/npm/zod';

export const importsInFolderTypeFindLayerResultContract = z
  .object({
    entries: z.array(z.string().brand<'ImportsInFolderTypeFindLayerResultEntries'>()),
    layers: z.array(z.string().brand<'ImportsInFolderTypeFindLayerResultLayers'>()),
  })
  .brand<'ImportsInFolderTypeFindLayerResult'>();

export type ImportsInFolderTypeFindLayerResult = z.infer<
  typeof importsInFolderTypeFindLayerResultContract
>;
