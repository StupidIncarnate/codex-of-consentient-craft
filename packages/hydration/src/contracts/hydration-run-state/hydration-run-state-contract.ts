/**
 * PURPOSE: What the walk carries from one op to the next — the record each ref resolved to, the
 * records `saveRecordAs` named, and the recipe name every mid-run error opens with. Reach for this
 * over threading three separate parameters through every layer broker: `ban-adhoc-types` refuses an
 * inline structural type, and this carrier is the one thing every layer broker touches.
 *
 * A `Map` has no zod shape, so `records` and `saved` arrive through the TYPE's own intersection —
 * the zod half validates only `recipeName`, exactly as `ingredientConfigContract`'s own `routes` and
 * `transitions` keys carry their function halves outside the parse.
 *
 * USAGE:
 * hydrationRunStateContract.parse({ recipeName: 'guild-mid-execution' });
 * // Returns { recipeName: RecipeName } — a caller's own literal adds `records` and `saved`
 */
import { z } from 'zod';
import { recipeNameContract } from '../recipe-name/recipe-name-contract';
import type { RowRef } from '../row-ref/row-ref-contract';
import type { SavedRecordName } from '../saved-record-name/saved-record-name-contract';

export const hydrationRunStateContract = z.object({
  recipeName: recipeNameContract,
});

export type HydrationRunState = z.infer<typeof hydrationRunStateContract> & {
  records: Map<RowRef, unknown>;
  saved: Map<SavedRecordName, unknown>;
};
