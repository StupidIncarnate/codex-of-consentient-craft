/**
 * PURPOSE: What the walk carries from one op to the next — the record each ref resolved to, the
 * records `saveRecordAs` named, and the recipe name every mid-run error opens with. Reach for this
 * over threading three separate parameters through every layer broker: `ban-adhoc-types` refuses an
 * inline structural type, and this carrier is the one thing every layer broker touches.
 *
 * `records` and `saved` are `z.map`s, so a parse returns fresh `Map`s holding the same entries — the
 * walk mutates the parsed state, never the literal it was built from. A map value is whatever a
 * route or a saved name resolved to, `undefined` included (`saveRecordAs` of a ref with no record),
 * so it is a `z.custom` with no check rather than a shape.
 *
 * USAGE:
 * hydrationRunStateContract.parse({ recipeName: 'guild-mid-execution', records: new Map(), saved: new Map() });
 * // Returns { recipeName: RecipeName, records: Map<RowRef, unknown>, saved: Map<SavedRecordName, unknown> }
 */
import { z } from '#gateway/npm/zod';
import { rowRefStatics } from '../../statics/row-ref/row-ref-statics';

const { separator, matchWord } = rowRefStatics.slot;
const ROW_REF_SLOT = `(?:\\d+${separator}\\d+|${matchWord})`;
const ROW_REF_SEGMENT = `[A-Za-z][A-Za-z0-9-]*\\[${ROW_REF_SLOT}\\]`;
const ROW_REF_PATTERN = new RegExp(`^${ROW_REF_SEGMENT}(?:\\/${ROW_REF_SEGMENT})*$`, 'u');
const ROW_REF_MESSAGE = "must be an ancestor path like 'guild[0:0]/quest[0:2]'";

const resolvedRecordContract = z.custom<unknown>();

export const hydrationRunStateContract = z
  .object({
    recipeName: z.string().min(1).brand<'HydrationRunStateRecipeName'>(),
    records: z.map(
      z.string().min(1).regex(ROW_REF_PATTERN, ROW_REF_MESSAGE),
      resolvedRecordContract,
    ),
    saved: z.map(z.string().min(1), resolvedRecordContract),
  })
  .brand<'HydrationRunState'>();

export type HydrationRunState = z.infer<typeof hydrationRunStateContract>;
