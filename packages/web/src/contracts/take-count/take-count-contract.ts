/**
 * PURPOSE: Branded count value passed to rxjs take() — the number of emissions before the source stream is completed. Must be a positive integer.
 *
 * USAGE:
 * takeCountContract.parse(1);
 * // Returns TakeCount: 1
 */

import { z } from 'zod';

export const takeCountContract = z.number().int().positive().brand<'TakeCount'>();

export type TakeCount = z.infer<typeof takeCountContract>;
