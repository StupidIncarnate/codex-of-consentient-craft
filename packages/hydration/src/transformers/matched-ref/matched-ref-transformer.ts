/**
 * PURPOSE: Derives a `filter`'s RUN-TIME placeholder — the ref its nested ops target before the
 * runner knows which real rows will match. Reach for this over `rowRefTransformer`: a filter
 * offers neither a `CallIndex` nor a `RowIndex` — how many rows it matches is a fact about the
 * gates, not the recipe — so its slot is the fixed `rowRefStatics.slot.matchWord`, a word no real
 * row's digit pair can ever produce. Two `filter` calls sharing an ingredient and a scope derive
 * the SAME placeholder here, on purpose — they describe the same live query, not two different
 * ones.
 *
 * USAGE:
 * matchedRefTransformer({ ancestors: ['guild[0:0]/quest[0:0]'], ingredient: 'operation' });
 * // Returns the branded RowRef 'guild[0:0]/quest[0:0]/operation[match]'
 */
import { rowRefContract } from '../../contracts/row-ref/row-ref-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import { rowRefStatics } from '../../statics/row-ref/row-ref-statics';

export const matchedRefTransformer = ({
  ancestors,
  ingredient,
}: {
  ancestors: readonly RowRef[];
  ingredient: IngredientName;
}): RowRef => {
  const segments = [...ancestors, `${ingredient}[${rowRefStatics.slot.matchWord}]`];
  return rowRefContract.parse(segments.join('/'));
};
