/**
 * PURPOSE: Records whether a --onlyTests pattern found anything inside one project's run, so the
 * run as a whole can tell "this package holds no test by that name" from "no package holds one"
 *
 * USAGE:
 * testNamePatternMatchContract.parse('unmatched');
 * // Returns: TestNamePatternMatch
 */

import { z } from 'zod';

export const testNamePatternMatchContract = z.enum(['matched', 'unmatched']);

export type TestNamePatternMatch = z.infer<typeof testNamePatternMatchContract>;
