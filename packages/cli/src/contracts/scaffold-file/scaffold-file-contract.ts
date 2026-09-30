/**
 * PURPOSE: The element type packageScaffoldFilesTransformer's output list is built from, so a
 * scaffold plan can be asserted and dry-run-printed before any file touches disk.
 *
 * USAGE:
 * const file = scaffoldFileContract.parse({ relativePath: 'package.json', contents: '{}\n' });
 * // Returns validated ScaffoldFile
 */

import { z } from '#gateway/npm/zod';

export const scaffoldFileContract = z
  .object({
    relativePath: z.string().brand<'ScaffoldFileRelativePath'>(),
    contents: z.string().brand<'ScaffoldFileContents'>(),
  })
  .brand<'ScaffoldFile'>();

export type ScaffoldFile = z.infer<typeof scaffoldFileContract>;
