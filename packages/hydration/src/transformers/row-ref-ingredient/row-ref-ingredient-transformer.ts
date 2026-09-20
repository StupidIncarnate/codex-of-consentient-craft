/**
 * PURPOSE: Recovers which ingredient a row belongs to from its build-time ref. Reach for this
 * wherever an ancestor is known only as a `RowRef` — `op-create`'s `ancestors` is a list of refs,
 * not of names, so link resolution and the unlinked-row refusal both have to ask this question.
 *
 * USAGE:
 * rowRefIngredientTransformer({ rowRef: 'guild[0:0]/quest[0:2]' });
 * // Returns the branded IngredientName 'quest'
 */
import { ingredientNameContract } from '../../contracts/ingredient-name/ingredient-name-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';

export const rowRefIngredientTransformer = ({ rowRef }: { rowRef: RowRef }): IngredientName => {
  const lastSegment = rowRef.split('/').at(-1) ?? '';
  const ingredientName = lastSegment.split('[').at(0) ?? '';
  return ingredientNameContract.parse(ingredientName);
};
