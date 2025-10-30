/**
 * PURPOSE: Zod schema for validating any file path (absolute or relative)
 *
 * USAGE:
 * const path = filePathContract.parse('/home/user/file.ts');
 * // Returns branded FilePath type that accepts both absolute and relative paths
 */

import { z } from 'zod';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { relativeFilePathContract } from '../relative-file-path/relative-file-path-contract';

export const filePathContract = z
  .union([absoluteFilePathContract, relativeFilePathContract])
  .brand<'FilePath'>();

export type FilePath = z.infer<typeof filePathContract>;
