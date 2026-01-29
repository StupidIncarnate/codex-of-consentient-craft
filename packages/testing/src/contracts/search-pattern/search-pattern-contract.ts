/**
 * PURPOSE: Defines a branded string type for text search patterns in E2E testing
 *
 * USAGE:
 * const pattern = searchPatternContract.parse('DangerFun');
 * // Returns branded SearchPattern string for use in waitForScreen contains/excludes
 */
import { z } from 'zod';

export const searchPatternContract = z.string().brand<'SearchPattern'>();

export type SearchPattern = z.infer<typeof searchPatternContract>;
