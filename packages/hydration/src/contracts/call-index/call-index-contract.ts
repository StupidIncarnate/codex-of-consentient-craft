/**
 * PURPOSE: A `.add()` call's 0-based position among every `.add()` call made on ONE collection
 * instance, in the order those calls run. Reach for this over `RowIndex`: that value restarts at 0
 * inside every `add` on purpose, which is exactly why two sibling `add` calls need a SEPARATE axis
 * to keep their rows apart — this is that axis. `rowRefTransformer` folds it into the ref itself,
 * since a reference is derived from where a row sits AND which call minted it, never from
 * `defaults(index)`.
 *
 * USAGE:
 * callIndexContract.parse(0);
 * // Returns a branded CallIndex
 */
import { z } from 'zod';

export const callIndexContract = z.number().int().nonnegative().brand<'CallIndex'>();

export type CallIndex = z.infer<typeof callIndexContract>;
