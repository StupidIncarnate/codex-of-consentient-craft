/**
 * PURPOSE: Builds the op that selects rows at RUN time and carries the ops to replay on what it
 * matches, scoped to the immediate host it was called on. `matchedRef`, the placeholder those nested
 * ops target, is DERIVED here from `ingredient` and `scope` via `matchedRefTransformer` — a filter
 * offers no `CallIndex` and no `RowIndex`, so its slot is the fixed match word rather than either
 * half of a real row's digit pair; the runner substitutes each row it actually finds for that
 * placeholder. `expect` defaults to `'some'` when the caller omits it, and `scope` is OMITTED from
 * the built op entirely when absent, never carried as `scope: undefined`.
 *
 * USAGE:
 * opFilterTransformer({
 *   ingredient: 'operation',
 *   scope: 'guild[0:0]/quest[0:0]',
 *   where: { role: 'riftcarver' },
 *   expect: 'one',
 *   ops: [],
 * });
 * // Returns { op: 'filter', ingredient: 'operation', scope: 'guild[0:0]/quest[0:0]', where: {...}, expect: 'one', matchedRef: 'guild[0:0]/quest[0:0]/operation[match]', ops: [] }
 */
import { opFilterContract } from '../../contracts/op-filter/op-filter-contract';
import type { OpFilter, OpFilterNestedOp } from '../../contracts/op-filter/op-filter-contract';
import type { IngredientName } from '../../contracts/ingredient-name/ingredient-name-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import type { FilterExpect } from '../../contracts/filter-expect/filter-expect-contract';
import { matchedRefTransformer } from '../matched-ref/matched-ref-transformer';

export const opFilterTransformer = ({
  ingredient,
  scope,
  where,
  expect: filterExpect,
  ops,
}: {
  ingredient: IngredientName;
  scope?: RowRef;
  where: FieldValues;
  expect?: FilterExpect;
  ops: readonly OpFilterNestedOp[];
}): OpFilter => {
  const matchedRef = matchedRefTransformer({
    ancestors: scope === undefined ? [] : [scope],
    ingredient,
  });

  return opFilterContract.parse({
    op: 'filter',
    ingredient,
    ...(scope === undefined ? {} : { scope }),
    where,
    expect: filterExpect ?? 'some',
    matchedRef,
    ops,
  });
};
