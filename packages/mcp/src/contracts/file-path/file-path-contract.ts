/**
 * PURPOSE: Defines a branded string type for file paths (absolute or relative)
 *
 * USAGE:
 * const path: FilePath = filePathContract.parse('src/contracts/file-path');
 * // Returns a branded FilePath string type
 */
import { z } from 'zod';

export const filePathContract = z.string().brand<'FilePath'>();

export type FilePath = z.infer<typeof filePathContract>;
