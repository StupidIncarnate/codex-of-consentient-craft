/**
 * PURPOSE: Zod schema for validating relative file paths that start with ./ or ../
 *
 * USAGE:
 * const path = relativeFilePathContract.parse('./src/utils.ts');
 * // Returns branded RelativeFilePath type that starts with ./ or ../
 */

import { z } from 'zod';

export const relativeFilePathContract = z
  .string()
  .min(1)
  .refine(
    (path) =>
      // Must start with ./ or ../
      path.startsWith('./') || path.startsWith('../'),
    {
      message: 'Path must be relative (start with ./ or ../)',
    },
  )
  .brand<'RelativeFilePath'>();

export type RelativeFilePath = z.infer<typeof relativeFilePathContract>;
