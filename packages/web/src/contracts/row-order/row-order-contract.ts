/**
 * PURPOSE: Defines a branded positive integer type for 1-based execution row order numbers
 *
 * USAGE:
 * rowOrderContract.parse(1);
 * // Returns: RowOrder branded number
 */

import { z } from 'zod';

export const rowOrderContract = z.number().int().positive().brand<'RowOrder'>();

export type RowOrder = z.infer<typeof rowOrderContract>;
