/**
 * PURPOSE: Defines a branded boolean type for timeout flags
 *
 * USAGE:
 * const flag: TimedOutFlag = timedOutFlagContract.parse(true);
 * // Returns branded boolean
 */

import { z } from 'zod';

export const timedOutFlagContract = z.boolean().brand<'TimedOutFlag'>();

export type TimedOutFlag = z.infer<typeof timedOutFlagContract>;
