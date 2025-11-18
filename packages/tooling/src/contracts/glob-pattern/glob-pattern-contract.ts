/**
 * PURPOSE: Defines a branded string type for glob patterns with validation.
 *
 * USAGE:
 * const pattern = globPatternContract.parse('**\/*.ts');
 * // Returns: GlobPattern (branded string)
 */
import { z } from 'zod';

export const globPatternContract = z.string().brand<'GlobPattern'>();

export type GlobPattern = z.infer<typeof globPatternContract>;
