/**
 * PURPOSE: Validates filename strings ensuring they don't contain path separators
 *
 * USAGE:
 * const filename = fileNameContract.parse('my-file.ts');
 * // Returns a validated file name; throws on '/path/file.ts' or empty string
 */
import { z } from '#gateway/npm/zod';

export const fileNameContract = z
  .string()
  .min(1, 'Filename cannot be empty')
  .regex(/^[^/\\]+$/u, 'Filename cannot contain path separators (/ or \\)');

export type FileName = z.infer<typeof fileNameContract>;
