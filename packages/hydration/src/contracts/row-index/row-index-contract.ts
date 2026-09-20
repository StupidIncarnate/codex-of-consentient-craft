/**
 * PURPOSE: A row's 0-based position inside ITS OWN `add`, the one value `defaults(index)`
 * receives. Reach for this over any counter that spans the plan — two separate `add(2, …)` calls
 * both see 0 and 1.
 *
 * USAGE:
 * rowIndexContract.parse(0);
 * // Returns a branded RowIndex
 */
import { z } from 'zod';

export const rowIndexContract = z.number().int().nonnegative().brand<'RowIndex'>();

export type RowIndex = z.infer<typeof rowIndexContract>;
