/**
 * PURPOSE: Validates file name for integration test files
 *
 * USAGE:
 * import {fileNameContract} from './file-name-contract';
 * const fileName = fileNameContract.parse('test.txt');
 * // Returns validated FileName type
 */

import { z } from 'zod';

export const fileNameContract = z.string().brand<'FileName'>();

export type FileName = z.infer<typeof fileNameContract>;
