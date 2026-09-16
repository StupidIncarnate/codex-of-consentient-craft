/**
 * PURPOSE: Puts one row's WHOLE record on the plan's output under the name the recipe gave it.
 * Reach for this rather than saving an id — the ids come along inside the record, so a second verb
 * for a subset of the same thing would only make callers learn which one carries the slug.
 *
 * USAGE:
 * opSaveRecordApplyLayerBroker({ op, state });
 * // Returns the mutated state, with state.saved.get(op.name) now holding the row's whole record
 */
import type { OpSaveRecord } from '../../../contracts/op-save-record/op-save-record-contract';
import type { HydrationRunState } from '../../../contracts/hydration-run-state/hydration-run-state-contract';

export const opSaveRecordApplyLayerBroker = ({
  op,
  state,
}: {
  op: OpSaveRecord;
  state: HydrationRunState;
}): HydrationRunState => {
  state.saved.set(op.name, state.records.get(op.ref));
  return state;
};
