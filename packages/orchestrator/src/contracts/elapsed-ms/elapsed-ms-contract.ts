/**
 * PURPOSE: Defines a branded number type for elapsed time in milliseconds
 *
 * USAGE:
 * elapsedMsContract.parse(1500);
 * // Returns: ElapsedMs branded number
 */

import { z } from 'zod';

export const elapsedMsContract = z.number().int().nonnegative().brand<'ElapsedMs'>();

export type ElapsedMs = z.infer<typeof elapsedMsContract>;
