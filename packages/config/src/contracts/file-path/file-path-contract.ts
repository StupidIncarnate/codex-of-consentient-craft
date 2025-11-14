/**
 * PURPOSE: Validates and brands file path strings with minimum length requirement
 *
 * USAGE:
 * import {filePathContract} from './file-path-contract';
 * const path = filePathContract.parse('/path/to/file.ts');
 * // Returns branded FilePath type
 */

import { z } from 'zod';

export const filePathContract = z.string().min(1).brand<'FilePath'>();
export type FilePath = z.infer<typeof filePathContract>;
