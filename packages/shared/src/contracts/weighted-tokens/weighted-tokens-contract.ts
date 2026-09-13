/**
 * PURPOSE: Token spend after the cost multipliers are applied — the one number that makes the four
 *   raw counts comparable to each other and to a ceiling. Reach for this over a raw token count
 *   whenever two kinds of token are being added together: cache reads outnumber output tokens by
 *   roughly 400 to 1 in real usage, so an unweighted sum measures the cache and nothing else.
 *
 * USAGE:
 * weightedTokensContract.parse(2_751_372_486);
 * // Returns a branded WeightedTokens
 */

import { z } from 'zod';

export const weightedTokensContract = z.number().min(0).brand<'WeightedTokens'>();

export type WeightedTokens = z.infer<typeof weightedTokensContract>;
