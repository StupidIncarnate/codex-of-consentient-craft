/**
 * PURPOSE: Zod schema for file path strings with validation and branding
 *
 * USAGE:
 * const path = filePathContract.parse('/path/to/file.ts');
 * // Returns branded FilePath string with minimum length of 1
 */
import { z } from 'zod';

export const filePathContract = z.string().min(1).brand<'FilePath'>();
export type FilePath = z.infer<typeof filePathContract>;
