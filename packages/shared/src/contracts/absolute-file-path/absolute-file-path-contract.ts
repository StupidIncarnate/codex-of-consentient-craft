/**
 * PURPOSE: Zod schema for validating absolute file paths on Unix/Linux and Windows systems
 *
 * USAGE:
 * const filePath = absoluteFilePathContract.parse('/home/user/file.ts');
 * // Returns branded AbsoluteFilePath type that starts with / or C:\ on Windows
 */

import { z } from 'zod';

export const absoluteFilePathContract = z
  .string()
  .min(1)
  .refine(
    (path) => {
      // Unix/Linux absolute path
      if (path.startsWith('/')) {
        return true;
      }
      // Windows absolute path (C:\, D:\, etc.)
      if (/^[A-Za-z]:\\/u.test(path)) {
        return true;
      }
      return false;
    },
    {
      message: 'Path must be absolute (start with / or C:\\ on Windows)',
    },
  )
  .brand<'AbsoluteFilePath'>();

export type AbsoluteFilePath = z.infer<typeof absoluteFilePathContract>;
