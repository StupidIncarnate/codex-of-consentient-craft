/**
 * PURPOSE: Validates and brands string content from files
 *
 * USAGE:
 * import {fileContentsContract} from './file-contents-contract';
 * const contents = fileContentsContract.parse('file content here');
 * // Returns branded FileContents type
 */

import { z } from 'zod';

export const fileContentsContract = z.string().brand<'FileContents'>();
export type FileContents = z.infer<typeof fileContentsContract>;
