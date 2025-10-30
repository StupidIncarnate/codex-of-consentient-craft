/**
 * PURPOSE: Zod schema for file content strings with branding
 *
 * USAGE:
 * const contents = fileContentsContract.parse(rawContent);
 * // Returns branded FileContents string
 */
import { z } from 'zod';

export const fileContentsContract = z.string().brand<'FileContents'>();
export type FileContents = z.infer<typeof fileContentsContract>;
