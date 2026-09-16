/**
 * PURPOSE: Builds the op that mints one row — the fields `defaults(index)` produced for it, and the
 * ancestor chain the runner walks to fill its `links`. The row's own `ref` is DERIVED here from
 * `ingredient`, `callIndex`, `index` and `ancestors` via `rowRefTransformer`, never passed in — a
 * create op is where a ref first comes into existence, which makes this the one op transformer
 * that computes its own identity rather than receiving an already-resolved one.
 *
 * USAGE:
 * opCreateTransformer({ ingredient: 'quest', callIndex: 0, index: 1, ancestors: ['guild[0:0]'], fields: { title: 'Quest 2' } });
 * // Returns { op: 'create', ingredient: 'quest', ref: 'guild[0:0]/quest[0:1]', index: 1, ancestors: ['guild[0:0]'], fields: {...} }
 */
import { opCreateContract } from '../../contracts/op-create/op-create-contract';
import type { OpCreate } from '../../contracts/op-create/op-create-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { CallIndex } from '../../contracts/call-index/call-index-contract';
import type { RowIndex } from '../../contracts/row-index/row-index-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import { rowRefTransformer } from '../row-ref/row-ref-transformer';

export const opCreateTransformer = ({
  ingredient,
  callIndex,
  index,
  ancestors,
  fields,
}: {
  ingredient: IngredientName;
  callIndex: CallIndex;
  index: RowIndex;
  ancestors: readonly RowRef[];
  fields: FieldValues;
}): OpCreate => {
  const ref = rowRefTransformer({ ancestors, ingredient, callIndex, index });

  return opCreateContract.parse({
    op: 'create',
    ingredient,
    ref,
    index,
    ancestors,
    fields,
  });
};
