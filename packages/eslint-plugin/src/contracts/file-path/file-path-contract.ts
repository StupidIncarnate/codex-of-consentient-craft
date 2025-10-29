import { z } from 'zod';

/**
 * PURPOSE: Validates and brands file path strings (relative, absolute, or module paths)
 *
 * USAGE:
 * const path = filePathContract.parse('./src/file.ts');
 * // Returns branded FilePath string
 */
export const filePathContract = z.string().brand<'FilePath'>();

export type FilePath = z.infer<typeof filePathContract>;
