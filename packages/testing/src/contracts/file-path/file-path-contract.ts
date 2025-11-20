/**
 * PURPOSE: Validates file path strings for test environment
 *
 * USAGE:
 * import {filePathContract} from './file-path-contract';
 * const path = filePathContract.parse('/tmp/test.txt');
 * // Returns validated FilePath type
 */

import { z } from 'zod';

export const filePathContract = z.string().brand<'FilePath'>();

export type FilePath = z.infer<typeof filePathContract>;
