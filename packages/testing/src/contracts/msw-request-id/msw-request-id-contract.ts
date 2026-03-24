/**
 * PURPOSE: Branded string type for MSW request correlation IDs
 *
 * USAGE:
 * const id = mswRequestIdContract.parse('abc-123');
 * // Returns validated MswRequestId branded type
 */

import { z } from 'zod';

export const mswRequestIdContract = z.string().brand<'MswRequestId'>();

export type MswRequestId = z.infer<typeof mswRequestIdContract>;
