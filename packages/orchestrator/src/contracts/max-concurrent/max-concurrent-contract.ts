/**
 * PURPOSE: Defines a branded number type for maximum concurrency limit
 *
 * USAGE:
 * maxConcurrentContract.parse(3);
 * // Returns: MaxConcurrent branded number
 */

import { z } from 'zod';

export const maxConcurrentContract = z.number().int().min(1).brand<'MaxConcurrent'>();

export type MaxConcurrent = z.infer<typeof maxConcurrentContract>;
