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
import { recipeNameContract } from '../recipe-name/recipe-name-contract';
import { rowRefContract } from '../row-ref/row-ref-contract';
import { savedRecordNameContract } from '../saved-record-name/saved-record-name-contract';

const resolvedRecordContract = z.custom<unknown>();

export const hydrationRunStateContract = z.object({
  recipeName: recipeNameContract,
  records: z.map(rowRefContract, resolvedRecordContract),
  saved: z.map(savedRecordNameContract, resolvedRecordContract),
});

export type HydrationRunState = z.infer<typeof hydrationRunStateContract>;
