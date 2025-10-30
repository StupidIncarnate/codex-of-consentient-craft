/**
 * PURPOSE: Zod schema for validating file content strings
 *
 * USAGE:
 * const contents = fileContentsContract.parse('const x = 1;');
 * // Returns branded FileContents type representing the text content of a file
 */

import { z } from 'zod';

export const fileContentsContract = z.string().brand<'FileContents'>();

export type FileContents = z.infer<typeof fileContentsContract>;
