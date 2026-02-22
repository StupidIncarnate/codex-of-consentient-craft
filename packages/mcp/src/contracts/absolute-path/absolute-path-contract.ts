/**
 * PURPOSE: Defines a branded string type for absolute file paths
 *
 * USAGE:
 * const path: AbsolutePath = absolutePathContract.parse('/home/user/file.ts');
 * // Returns a branded AbsolutePath string type
 */
import { z } from 'zod';

export const absolutePathContract = z.string().brand<'AbsolutePath'>();

export type AbsolutePath = z.infer<typeof absolutePathContract>;
