import { z } from 'zod';

/**
 * PURPOSE: Validates filename strings ensuring they don't contain path separators
 *
 * USAGE:
 * const filename = fileNameContract.parse('my-file.ts');
 * // Returns branded FileName; throws on '/path/file.ts' or empty string
 */
export const fileNameContract = z
  .string()
  .min(1, 'Filename cannot be empty')
  .regex(/^[^/\\]+$/u, 'Filename cannot contain path separators (/ or \\)')
  .brand<'FileName'>();

export type FileName = z.infer<typeof fileNameContract>;
