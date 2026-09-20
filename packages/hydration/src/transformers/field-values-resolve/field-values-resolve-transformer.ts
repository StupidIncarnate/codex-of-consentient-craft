/**
 * PURPOSE: Replaces every cross-link in one op's values with what it resolves to, leaving literals
 * untouched. Reach for this at every point the runner hands values to a route — a `create`'s
 * fields, a `set`'s `written`, an `extra`'s args, a `filter`'s `where`. Checks `isSavedRefGuard`
 * first (cheap, no allocation) and only re-parses through `savedRefContract` on the rare branch
 * where it is true, per that guard's own stated reasoning.
 *
 * USAGE:
 * fieldValuesResolveTransformer({
 *   values: FieldValuesStub({ title: 'x', userRequest: SavedRefStub({ name: 'origin', field: 'sessionId' }) }),
 *   saved: new Map([[SavedRecordNameStub({ value: 'origin' }), { sessionId: 's1' }]]),
 * });
 * // Returns { title: 'x', userRequest: 's1' }
 */
import { fieldValuesContract } from '../../contracts/field-values/field-values-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import { savedRefContract } from '../../contracts/saved-ref/saved-ref-contract';
import type { SavedRecordName } from '../../contracts/saved-record-name/saved-record-name-contract';
import { isSavedRefGuard } from '../../guards/is-saved-ref/is-saved-ref-guard';
import { savedRefResolveTransformer } from '../saved-ref-resolve/saved-ref-resolve-transformer';

export const fieldValuesResolveTransformer = ({
  values,
  saved,
}: {
  values: FieldValues;
  saved: Map<SavedRecordName, unknown>;
}): FieldValues => {
  const resolved: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(values)) {
    resolved[field] = isSavedRefGuard({ value })
      ? savedRefResolveTransformer({ ref: savedRefContract.parse(value), saved })
      : value;
  }

  return fieldValuesContract.parse(resolved);
};
