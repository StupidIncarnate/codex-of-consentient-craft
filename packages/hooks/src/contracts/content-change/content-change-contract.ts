/**
 * PURPOSE: Zod schema for content change with old and new content
 *
 * USAGE:
 * const change = contentChangeContract.parse({ oldContent, newContent });
 * // Returns validated ContentChange with branded FileContents
 */
import { z } from '#gateway/npm/zod';

export const contentChangeContract = z.object({
  oldContent: z.string().brand<'ContentChangeOldContent'>(),
  newContent: z.string().brand<'ContentChangeNewContent'>(),
}).brand<'ContentChange'>();

export type ContentChange = z.infer<typeof contentChangeContract>;
