/**
 * PURPOSE: Points a filter's nested ops at one real matched row, by rebinding the `matchedRef`
 * placeholder onto that row's own record. Reach for this once per matched row — the chain could not
 * know the count, so it wrote one set of nested ops against one stand-in ref, and this is what makes
 * each replay resolve `matchedRef` to a DIFFERENT real record. Returns a NEW state so the rebind
 * itself stays pure; the records map a caller already holds is left untouched.
 *
 * USAGE:
 * matchedRowRebindTransformer({
 *   state: HydrationRunStateStub({}),
 *   matchedRef: RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[match]' }),
 *   record: { id: 'op1', role: 'riftcarver' },
 * });
 * // Returns a HydrationRunState whose records map also holds that record under matchedRef
 */
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { HydrationRunState } from '../../contracts/hydration-run-state/hydration-run-state-contract';

export const matchedRowRebindTransformer = ({
  state,
  matchedRef,
  record,
}: {
  state: HydrationRunState;
  matchedRef: RowRef;
  record: unknown;
}): HydrationRunState => ({
  ...state,
  records: new Map(state.records).set(matchedRef, record),
});
