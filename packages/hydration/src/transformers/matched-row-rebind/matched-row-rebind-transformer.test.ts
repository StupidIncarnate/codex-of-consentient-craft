import { matchedRowRebindTransformer } from './matched-row-rebind-transformer';
import { HydrationRunStateStub } from '../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';

describe('matchedRowRebindTransformer', () => {
  describe('rebinding the placeholder onto a real row', () => {
    it('VALID: {a matched record} => the returned state resolves matchedRef to that record', () => {
      const state = HydrationRunStateStub({});
      const matchedRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[match]' });

      const rebound = matchedRowRebindTransformer({
        state,
        matchedRef,
        record: { id: 'op1', role: 'riftcarver' },
      });

      expect(rebound.records.get(matchedRef)).toStrictEqual({ id: 'op1', role: 'riftcarver' });
    });

    it('VALID: {a second matched record} => rebinding again replaces what the placeholder resolves to', () => {
      const state = HydrationRunStateStub({});
      const matchedRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[match]' });
      const first = matchedRowRebindTransformer({
        state,
        matchedRef,
        record: { id: 'op1', role: 'riftcarver' },
      });

      const second = matchedRowRebindTransformer({
        state: first,
        matchedRef,
        record: { id: 'op2', role: 'riftcarver' },
      });

      expect(second.records.get(matchedRef)).toStrictEqual({ id: 'op2', role: 'riftcarver' });
    });
  });

  describe('purity — the input state is left untouched', () => {
    it('VALID: {rebind onto a fresh state} => the original state’s records map does not gain the entry', () => {
      const state = HydrationRunStateStub({});
      const matchedRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[match]' });

      matchedRowRebindTransformer({ state, matchedRef, record: { id: 'op1' } });

      expect(state.records.get(matchedRef)).toBe(undefined);
    });

    it('VALID: {a state already holding other rows} => those rows survive alongside the rebind', () => {
      const otherRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]' });
      const state = HydrationRunStateStub({});
      state.records.set(otherRef, { id: 'q1' });
      const matchedRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[match]' });

      const rebound = matchedRowRebindTransformer({ state, matchedRef, record: { id: 'op1' } });

      expect(rebound.records.get(otherRef)).toStrictEqual({ id: 'q1' });
    });
  });
});
