/**
 * PURPOSE: Defines a branded number type for maximum loop iterations
 *
 * USAGE:
 * maxIterationsContract.parse(5);
 * // Returns: 5 as MaxIterations
 */

import { z } from 'zod';

export const maxIterationsContract = z.number().int().positive().brand<'MaxIterations'>();

export type MaxIterations = z.infer<typeof maxIterationsContract>;
