import { opSetApplyLayerBroker } from './op-set-apply-layer-broker';
import { opSetApplyLayerBrokerProxy } from './op-set-apply-layer-broker.proxy';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { TransitionSpecStub } from '../../../contracts/transition-spec/transition-spec.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';
import { opSaveRecordApplyLayerBroker } from './op-save-record-apply-layer-broker';
import { OpSaveRecordStub } from '../../../contracts/op-save-record/op-save-record.stub';

describe('opSetApplyLayerBroker', () => {
  describe('walking a transition — reach receives both ends and the row', () => {
    it('VALID: {set status to in_progress on a created quest} => reach received from, to, target and the row’s own record', async () => {
      opSetApplyLayerBrokerProxy();
      let receivedArgs: unknown = null;
      const target = HydrationTargetStub({});
      const config = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (args: unknown): unknown => {
            receivedArgs = args;
            return { status: 'in_progress', title: 'Quest 1' };
          },
        }),
      });
      const state = HydrationRunStateStub({});
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), {
        status: 'created',
        title: 'Quest 1',
      });
      const op = OpSetStub({
        ref: 'quest[0:0]',
        written: {},
        transition: { field: 'status', to: 'in_progress' },
      });

      await opSetApplyLayerBroker({ op, target, config, state });

      expect(receivedArgs).toStrictEqual({
        from: 'created',
        to: 'in_progress',
        target,
        record: { status: 'created', title: 'Quest 1' },
      });
    });
  });

  describe('a successful walk — the record lands in state', () => {
    it('VALID: {reach returns the walked record} => a later saveRecordAs hands back what reach produced', async () => {
      opSetApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (): unknown => ({ status: 'in_progress', title: 'The running one' }),
        }),
      });
      const state = HydrationRunStateStub({});
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), {
        status: 'created',
        title: 'The running one',
      });
      const op = OpSetStub({
        ref: 'quest[0:0]',
        written: {},
        transition: { field: 'status', to: 'in_progress' },
      });

      await opSetApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });
      opSaveRecordApplyLayerBroker({
        op: OpSaveRecordStub({ ref: 'quest[0:0]', name: 'quest' }),
        state,
      });

      expect(state.saved.get('quest' as never)).toStrictEqual({
        status: 'in_progress',
        title: 'The running one',
      });
    });
  });

  describe('a transition is not free — what it mints is visible to what runs after it', () => {
    it('VALID: {a transition mints something} => a later op in the same walk sees it', async () => {
      opSetApplyLayerBrokerProxy();
      const mintedOperations: string[] = [];
      let observedAfterMint: number | null = null;
      const target = HydrationTargetStub({});
      const state = HydrationRunStateStub({});
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), { status: 'created' });
      state.records.set(RowRefStub({ value: 'session[0:0]' }), { title: 'before' });

      const questConfig = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (): unknown => {
            mintedOperations.push('operation[0:0]');
            return { status: 'in_progress' };
          },
        }),
      });
      const sessionConfig = IngredientConfigStub({
        name: 'session',
        transitions: TransitionSpecStub({
          field: 'title',
          to: ['a renamed quest'],
          reach: (): unknown => {
            observedAfterMint = mintedOperations.length;
            return { title: 'a renamed quest' };
          },
        }),
      });

      await opSetApplyLayerBroker({
        op: OpSetStub({
          ref: 'quest[0:0]',
          written: {},
          transition: { field: 'status', to: 'in_progress' },
        }),
        target,
        config: questConfig,
        state,
      });
      await opSetApplyLayerBroker({
        op: OpSetStub({
          ref: 'session[0:0]',
          written: {},
          transition: { field: 'title', to: 'a renamed quest' },
        }),
        target,
        config: sessionConfig,
        state,
      });

      expect(observedAfterMint).toBe(1);
    });
  });

  describe('the gates refuse the transition — sad-path row 6', () => {
    it('ERROR: {reach throws "a quest needs at least one session before it can start"} => throws HydrationTransitionRefusedError naming from, to and the gate', async () => {
      opSetApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (): unknown => {
            throw new Error('a quest needs at least one session before it can start');
          },
        }),
      });
      const state = HydrationRunStateStub({ recipeName: 'guild-mid-execution' as never });
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), { status: 'created' });
      const op = OpSetStub({
        ref: 'quest[0:0]',
        written: {},
        transition: { field: 'status', to: 'in_progress' },
      });

      await expect(
        opSetApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" cannot go to "in_progress" from "created": a quest needs at least one session before it can start$/u,
      );
    });
  });

  describe('setRaw — the field arrived through written, not transition, so nothing is walked', () => {
    it('VALID: {a set op with no transition key} => reach is never invoked, and the row already carrying the raw value is left untouched', async () => {
      opSetApplyLayerBrokerProxy();
      let reachCallCount = 0;
      const config = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (): unknown => {
            reachCallCount += 1;
            return undefined;
          },
        }),
      });
      const state = HydrationRunStateStub({});
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), {
        status: 'complete',
        title: 'Quest 1',
      });
      const op = OpSetStub({ ref: 'quest[0:0]', written: { status: 'complete' } });

      await opSetApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

      expect(reachCallCount).toBe(0);
      expect(state.records.get(RowRefStub({ value: 'quest[0:0]' }))).toStrictEqual({
        status: 'complete',
        title: 'Quest 1',
      });
    });
  });

  describe('an ingredient with no transitions declared', () => {
    it('EMPTY: {op carries a transition, config.transitions is undefined} => no-op, reach never invoked', async () => {
      opSetApplyLayerBrokerProxy();
      const config = IngredientConfigStub({ name: 'quest' });
      const state = HydrationRunStateStub({});
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), { title: 'Quest 1' });
      const op = OpSetStub({
        ref: 'quest[0:0]',
        written: {},
        transition: { field: 'status', to: 'in_progress' },
      });

      await opSetApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

      expect(state.records.get(RowRefStub({ value: 'quest[0:0]' }))).toStrictEqual({
        title: 'Quest 1',
      });
    });
  });
});
