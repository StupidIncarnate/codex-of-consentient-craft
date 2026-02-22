/**
 * PURPOSE: Defines a branded integer type for context token delta (difference between consecutive context counts, may be negative)
 *
 * USAGE:
 * contextTokenDeltaContract.parse(-3682);
 * // Returns: ContextTokenDelta branded number
 */

import { z } from 'zod';

export const contextTokenDeltaContract = z.number().int().brand<'ContextTokenDelta'>();

export type ContextTokenDelta = z.infer<typeof contextTokenDeltaContract>;
