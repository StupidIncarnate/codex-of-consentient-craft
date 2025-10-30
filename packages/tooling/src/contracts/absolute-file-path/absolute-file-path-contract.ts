/**
 * PURPOSE: Defines a branded string type for absolute file paths with validation.
 *
 * USAGE:
 * const filePath = absoluteFilePathContract.parse('/absolute/path/to/file.ts');
 * // Returns: AbsoluteFilePath (branded string)
 */
import { z } from 'zod';

export const absoluteFilePathContract = z.string().brand<'AbsoluteFilePath'>();

export type AbsoluteFilePath = z.infer<typeof absoluteFilePathContract>;
