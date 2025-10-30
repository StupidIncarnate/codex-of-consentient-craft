/**
 * PURPOSE: Defines a branded string type for file contents
 *
 * USAGE:
 * const contents: FileContents = fileContentsContract.parse('export const foo = 123;');
 * // Returns a branded FileContents string type
 */
import { z } from 'zod';

export const fileContentsContract = z.string().brand<'FileContents'>();

export type FileContents = z.infer<typeof fileContentsContract>;
