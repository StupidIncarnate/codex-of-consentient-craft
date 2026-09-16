/**
 * PURPOSE: Builds the op that puts values on a row that already exists, splitting them against the
 * ingredient's own `transitions.field` — the walked field lands in `transition`, everything else in
 * `written`. Reach for `opSetRawTransformer` instead wherever a field must be WRITTEN and not
 * walked; this file exists apart from it because a transformer gives each output shape its own
 * file, never an option flag on one.
 *
 * USAGE:
 * opSetTransformer({
 *   ref: 'guild[0:0]/quest[0:2]',
 *   values: { status: 'in_progress', title: 'The running one' },
 *   transitions: { field: 'status', to: ['in_progress'] },
 * });
 * // Returns { op: 'set', ref: 'guild[0:0]/quest[0:2]', written: { title: 'The running one' }, transition: { field: 'status', to: 'in_progress' } }
 */
import { opSetContract } from '../../contracts/op-set/op-set-contract';
import type { OpSet } from '../../contracts/op-set/op-set-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import type { TransitionSpec } from '../../contracts/transition-spec/transition-spec-contract';

export const opSetTransformer = ({
  ref,
  values,
  transitions,
}: {
  ref: RowRef;
  values: FieldValues;
  transitions?: TransitionSpec;
}): OpSet => {
  if (transitions === undefined || !(transitions.field in values)) {
    return opSetContract.parse({ op: 'set', ref, written: values });
  }

  const { [transitions.field]: to, ...written } = values;

  return opSetContract.parse({
    op: 'set',
    ref,
    written,
    transition: { field: transitions.field, to },
  });
};
