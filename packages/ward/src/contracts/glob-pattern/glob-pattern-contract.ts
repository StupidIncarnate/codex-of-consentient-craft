/**
 * PURPOSE: Branded string type for glob patterns used in file discovery
 *
 * USAGE:
 * const pattern = globPatternContract.parse('src/**\/*.ts');
 * // Returns: GlobPattern (branded string)
 */
import { z } from 'zod';

export const globPatternContract = z.string().brand<'GlobPattern'>();

export type GlobPattern = z.infer<typeof globPatternContract>;
