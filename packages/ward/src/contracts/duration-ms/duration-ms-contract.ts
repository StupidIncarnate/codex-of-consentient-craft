/**
 * PURPOSE: Defines a branded number type for duration in milliseconds
 *
 * USAGE:
 * const duration = durationMsContract.parse(150);
 * // Returns branded DurationMs type for timing values
 */

import { z } from 'zod';

export const durationMsContract = z.number().nonnegative().brand<'DurationMs'>();

export type DurationMs = z.infer<typeof durationMsContract>;
