/**
 * PURPOSE: Derives a row's build-time identity from where it sits in the chain — the ancestor
 * path, its own ingredient name, WHICH `add` call minted it, and its index within that call.
 * Reach for this over `fromSavedRefTransformer` wherever the target row is an ANCESTOR already on
 * the chain being built; reach for `matchedRefTransformer` instead for a `filter`'s own
 * placeholder, which has neither a `CallIndex` nor a `RowIndex` to offer. Nothing here calls a
 * clock, a random source or a uuid — the same plan built twice must produce byte-identical refs,
 * and folding `callIndex` in stays safe only because it is scoped to ONE collection instance,
 * never a value that survives between separate builds.
 *
 * USAGE:
 * rowRefTransformer({ ancestors: ['guild[0:0]'], ingredient: 'quest', callIndex: 0, index: 2 });
 * // Returns the branded RowRef 'guild[0:0]/quest[0:2]'
 */
import { rowRefContract } from '../../contracts/row-ref/row-ref-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import type { CallIndex } from '../../contracts/call-index/call-index-contract';
import type { RowIndex } from '../../contracts/row-index/row-index-contract';
import { rowRefStatics } from '../../statics/row-ref/row-ref-statics';

export const rowRefTransformer = ({
  ancestors,
  ingredient,
  callIndex,
  index,
}: {
  ancestors: readonly RowRef[];
  ingredient: IngredientName;
  callIndex: CallIndex;
  index: RowIndex;
}): RowRef => {
  const segments = [
    ...ancestors,
    `${ingredient}[${callIndex}${rowRefStatics.slot.separator}${index}]`,
  ];
  return rowRefContract.parse(segments.join('/'));
};
