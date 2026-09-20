/**
 * PURPOSE: A row's BUILD-TIME identity, as its ancestor path — `guild[0:0]/quest[0:2]`. Reach for
 * this, never a runtime id: the ids do not exist while the chain builds, and `saveRecordAs` is
 * how a runtime id travels instead. Each segment's bracket holds a `CallIndex` and a `RowIndex`,
 * `rowRefStatics.slot.separator`-joined, because two sibling `add` calls on one collection — or
 * one top-level ingredient added twice — would otherwise mint the same row index and need the
 * call they came from to stay apart. A `filter`'s own segment holds `rowRefStatics.slot.matchWord`
 * instead, since nothing at build time can give a placeholder either half of that pair — see
 * `matchedRefTransformer`. Each ingredient-name segment must stay inside the character class
 * `ingredientNameContract` allows, since that is exactly what a segment here encodes — a
 * hyphenated ingredient name like `work-item` is legal on both sides.
 *
 * USAGE:
 * rowRefContract.parse('guild[0:0]/quest[0:2]');
 * // Returns a branded RowRef
 */
import { z } from 'zod';
import { rowRefStatics } from '../../statics/row-ref/row-ref-statics';

const { separator, matchWord } = rowRefStatics.slot;
const ROW_REF_SLOT = `(?:\\d+${separator}\\d+|${matchWord})`;
const ROW_REF_SEGMENT = `[A-Za-z][A-Za-z0-9-]*\\[${ROW_REF_SLOT}\\]`;
const ROW_REF_PATTERN = new RegExp(`^${ROW_REF_SEGMENT}(?:\\/${ROW_REF_SEGMENT})*$`, 'u');

export const rowRefContract = z
  .string()
  .regex(ROW_REF_PATTERN, "must be an ancestor path like 'guild[0:0]/quest[0:2]'")
  .brand<'RowRef'>();

export type RowRef = z.infer<typeof rowRefContract>;
