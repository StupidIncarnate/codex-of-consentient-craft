/**
 * PURPOSE: How many rows a `filter` must match to be satisfied — `'one'`, `'some'` or `'any'`.
 * Reach for this over a boolean whenever a caller needs to say more than yes/no about a match
 * count. The default-to-`'some'` and the zero-match throw live where this value is actually
 * consumed — `filterArgsContract`'s default, and the runner's refusal — not here; this file only
 * says which three values are legal.
 *
 * Left unbranded, deliberately: zod's `.brand()` wraps a schema in `ZodBranded`, which drops the
 * `.options` accessor `ZodEnum` carries, and `it.each` over the valid set needs that accessor to
 * avoid hardcoding the three names a second time.
 *
 * USAGE:
 * filterExpectContract.parse('some');
 * // Returns 'one' | 'some' | 'any'
 */
import { z } from 'zod';

export const filterExpectContract = z.enum(['one', 'some', 'any']);

export type FilterExpect = z.infer<typeof filterExpectContract>;
