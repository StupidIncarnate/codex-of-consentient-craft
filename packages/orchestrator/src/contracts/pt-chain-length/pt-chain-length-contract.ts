/**
 * PURPOSE: Defines a branded non-negative integer type for an operation item's pt-continuation
 * chain length — how many ledger items (same role, same base text) already belong to the chain
 *
 * USAGE:
 * ptChainLengthContract.parse(2);
 * // Returns: PtChainLength branded number
 */

import { z } from 'zod';

export const ptChainLengthContract = z.number().int().nonnegative().brand<'PtChainLength'>();

export type PtChainLength = z.infer<typeof ptChainLengthContract>;
