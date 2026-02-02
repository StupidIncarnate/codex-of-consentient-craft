/**
 * PURPOSE: Defines a branded number type for timeout duration in milliseconds
 *
 * USAGE:
 * timeoutMsContract.parse(60000);
 * // Returns: TimeoutMs branded number
 */

import { z } from 'zod';

export const timeoutMsContract = z.number().int().min(0).brand<'TimeoutMs'>();

export type TimeoutMs = z.infer<typeof timeoutMsContract>;
