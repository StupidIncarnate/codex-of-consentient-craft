/**
 * PURPOSE: Validates file content for integration test files
 *
 * USAGE:
 * import {fileContentContract} from './file-content-contract';
 * const content = fileContentContract.parse('file content');
 * // Returns validated FileContent type
 */

import { z } from 'zod';

export const fileContentContract = z.string().brand<'FileContent'>();

export type FileContent = z.infer<typeof fileContentContract>;
