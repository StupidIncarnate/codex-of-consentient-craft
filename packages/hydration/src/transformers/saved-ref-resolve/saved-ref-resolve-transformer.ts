/**
 * PURPOSE: Turns one cross-link into the value it points at — the named record's field, or the
 * whole record when no field is named. Reach for `fieldValuesResolveTransformer` instead when a
 * whole field map is in hand; this one answers for a single value. Returns `FieldValues[FieldName]`
 * rather than a bare `unknown`: whatever this resolves to is headed for exactly one entry of a
 * plan's field-values map, whole record or single field alike.
 *
 * USAGE:
 * savedRefResolveTransformer({
 *   ref: SavedRefStub({ name: 'origin', field: 'sessionId' }),
 *   saved: new Map([[SavedRecordNameStub({ value: 'origin' }), { sessionId: 's1' }]]),
 * });
 * // Returns 's1'
 */
import type { FieldName } from '../../contracts/field-name/field-name-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import type { SavedRef } from '../../contracts/saved-ref/saved-ref-contract';
import type { SavedRecordName } from '../../contracts/saved-record-name/saved-record-name-contract';

export const savedRefResolveTransformer = ({
  ref,
  saved,
}: {
  ref: SavedRef;
  saved: Map<SavedRecordName, unknown>;
}): FieldValues[FieldName] => {
  const record = saved.get(ref.name);

  if (ref.field === undefined) {
    return record;
  }

  if (typeof record !== 'object' || record === null) {
    return undefined;
  }

  return (record as Record<PropertyKey, unknown>)[ref.field];
};
