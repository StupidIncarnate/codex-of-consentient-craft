/**
 * PURPOSE: Validates file names
 *
 * USAGE:
 * import {fileNameContract} from './file-name-contract';
 * const fileName = fileNameContract.parse('quest.json');
 * // Returns validated FileName type
 */

import { z } from 'zod';

export const fileNameContract = z.string().brand<'FileName'>();

export type FileName = z.infer<typeof fileNameContract>;
