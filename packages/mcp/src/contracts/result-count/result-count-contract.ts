/**
 * PURPOSE: Defines a branded non-negative integer type for result counts
 *
 * USAGE:
 * const count: ResultCount = resultCountContract.parse(5);
 * // Returns a branded ResultCount integer (0 or positive)
 */
import { z } from 'zod';

export const resultCountContract = z.number().int().nonnegative().brand<'ResultCount'>();

export type ResultCount = z.infer<typeof resultCountContract>;
