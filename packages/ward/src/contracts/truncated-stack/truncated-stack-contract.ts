/**
 * PURPOSE: Defines a branded string for a truncated stack trace
 *
 * USAGE:
 * truncatedStackContract.parse('at Object.<anonymous> (src/index.ts:10:5)\n  ... 5 more lines');
 * // Returns: TruncatedStack branded string
 */

import { z } from 'zod';

export const truncatedStackContract = z.string().brand<'TruncatedStack'>();

export type TruncatedStack = z.infer<typeof truncatedStackContract>;
