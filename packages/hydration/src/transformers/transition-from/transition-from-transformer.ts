/**
 * PURPOSE: Reads a row's CURRENT value of its transition field off the record the route returned, so
 * `reach` is told where it is starting from. Reach for this over the plan: the plan says where the
 * row should END, and the gates need both ends. Returns `FieldValues[FieldName]` rather than a bare
 * `unknown`, exactly as `savedRefResolveTransformer` does for the same reason — whatever this reads
 * off a record is headed for one entry of a plan's field-values map.
 *
 * USAGE:
 * transitionFromTransformer({ record: { status: 'created' }, field: 'status' });
 * // Returns 'created'
 */
import type { FieldName } from '../../contracts/field-name/field-name-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';

export const transitionFromTransformer = ({
  record,
  field,
}: {
  record: Record<string, unknown>;
  field: FieldName;
}): FieldValues[FieldName] => record[field];
