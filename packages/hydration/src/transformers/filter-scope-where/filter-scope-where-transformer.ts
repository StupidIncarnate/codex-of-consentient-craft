/**
 * PURPOSE: Narrows a filter's `where` to the rows under its immediate host, by the same `links`
 * entry that put the host's id on those rows in the first place. Reach for this over matching every
 * row of that ingredient anywhere in the instance — a `filter` inside a nested `add` is scoped to
 * its immediate host, and matching everywhere would let a recipe holding two parents remove rows
 * belonging to the one it did not select.
 *
 * USAGE:
 * filterScopeWhereTransformer({
 *   where: { role: 'riftcarver' },
 *   scope: RowRefStub({ value: 'guild[0:0]/quest[0:0]' }),
 *   links: [LinkSpecStub({ of: 'quest', as: 'questId' })],
 *   records: new Map([[RowRefStub({ value: 'guild[0:0]/quest[0:0]' }), { id: 'q1' }]]),
 * });
 * // Returns { role: 'riftcarver', questId: 'q1' }
 */
import { rowRefIngredientTransformer } from '../row-ref-ingredient/row-ref-ingredient-transformer';
import type { LinkSpec } from '../../contracts/link-spec/link-spec-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';

export const filterScopeWhereTransformer = ({
  where,
  scope,
  links,
  records,
}: {
  where: FieldValues;
  scope?: RowRef;
  links: readonly LinkSpec[];
  records: Map<RowRef, unknown>;
}): FieldValues => {
  if (scope === undefined) {
    return where;
  }

  const scopeIngredient = rowRefIngredientTransformer({ rowRef: scope });
  const link = links.find((candidate) => candidate.of === scopeIngredient);
  if (link === undefined) {
    return where;
  }

  const scopeRecord = records.get(scope);
  const fromField = link.from ?? 'id';
  const scopeId =
    typeof scopeRecord === 'object' && scopeRecord !== null
      ? (scopeRecord as Record<PropertyKey, unknown>)[fromField]
      : undefined;

  return { ...where, [link.as]: scopeId };
};
