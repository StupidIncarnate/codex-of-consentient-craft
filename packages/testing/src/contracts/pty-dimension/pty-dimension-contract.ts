/**
 * PURPOSE: Defines terminal dimension (cols/rows) for PTY terminals
 *
 * USAGE:
 * const cols = ptyDimensionContract.parse(80);
 * // Returns validated PtyDimension branded type
 */

import { z } from 'zod';

export const ptyDimensionContract = z.number().int().positive().brand<'PtyDimension'>();

export type PtyDimension = z.infer<typeof ptyDimensionContract>;
