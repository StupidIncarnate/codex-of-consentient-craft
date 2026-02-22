/**
 * PURPOSE: Defines a branded string type for glob patterns used in file searches
 *
 * USAGE:
 * const pattern: GlobPattern = globPatternContract.parse('src/**\/*-broker.ts');
 * // Returns a branded GlobPattern string type
 */
import { z } from 'zod';

export const globPatternContract = z.string().brand<'GlobPattern'>();

export type GlobPattern = z.infer<typeof globPatternContract>;
