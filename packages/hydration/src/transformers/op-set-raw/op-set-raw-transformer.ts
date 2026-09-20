/**
 * PURPOSE: Builds the op that writes a field and walks NOTHING — a deliberately inconsistent row the
 * real gates would never have produced, for an adversarial walk. Reach for `opSetTransformer`
 * instead for the ordinary case; this file exists apart from it because the split against
 * `transitions.field` never runs here, and an `includeTransition` flag on one `op-set` file is
 * exactly the kind of option a transformer must not carry.
 *
 * USAGE:
 * opSetRawTransformer({ ref: 'guild[0:0]/quest[0:2]', values: { status: 'complete' } });
 * // Returns { op: 'set', ref: 'guild[0:0]/quest[0:2]', written: { status: 'complete' } } — no transition key
 */
import { opSetContract } from '../../contracts/op-set/op-set-contract';
import type { OpSet } from '../../contracts/op-set/op-set-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';

export const opSetRawTransformer = ({ ref, values }: { ref: RowRef; values: FieldValues }): OpSet =>
  opSetContract.parse({ op: 'set', ref, written: values });
