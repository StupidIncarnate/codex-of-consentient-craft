/**
 * PURPOSE: Defines a branded number type for tracking HTTP request counts in endpoint mocks
 *
 * USAGE:
 * const count: RequestCount = requestCountContract.parse(0);
 * // Returns a branded RequestCount number type for nonnegative integer counts
 */
import { z } from 'zod';

export const requestCountContract = z.number().int().nonnegative().brand<'RequestCount'>();

export type RequestCount = z.infer<typeof requestCountContract>;
