import { opFilterApplyLayerBroker } from './op-filter-apply-layer-broker';
import { opFilterApplyLayerBrokerProxy } from './op-filter-apply-layer-broker.proxy';
import { opSetApplyLayerBroker } from './op-set-apply-layer-broker';
import { OpFilterStub } from '../../../contracts/op-filter/op-filter.stub';
import { OpCreateStub } from '../../../contracts/op-create/op-create.stub';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import { OpRemoveStub } from '../../../contracts/op-remove/op-remove.stub';
import { OpSaveRecordStub } from '../../../contracts/op-save-record/op-save-record.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { TransitionSpecStub } from '../../../contracts/transition-spec/transition-spec.stub';
import { LinkSpecStub } from '../../../contracts/link-spec/link-spec.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';
import { HydrationQueryFailedError } from '../../../errors/hydration-query-failed/hydration-query-failed-error';
import { HydrationFilterExpectationError } from '../../../errors/hydration-filter-expectation/hydration-filter-expectation-error';
import { HydrationNestedIngredientUnregisteredError } from '../../../errors/hydration-nested-ingredient-unregistered/hydration-nested-ingredient-unregistered-error';

describe('opFilterApplyLayerBroker', () => {
  describe('the query fails mid-plan, distinct from matching zero rows — sad-path row 7', () => {
    it('ERROR: {query rejects with ECONNREFUSED} => throws HydrationQueryFailedError', async () => {
      opFilterApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'operation',
        routes: {
          write: (): unknown => undefined,
          query: (): unknown => {
            throw new Error('connect ECONNREFUSED');
          },
        },
      });
      const op = OpFilterStub({ where: { role: 'riftcarver' }, expect: 'some', ops: [] });
      const state = HydrationRunStateStub({});

      await expect(
        opFilterApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(HydrationQueryFailedError);

      await expect(
        opFilterApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "operation" filter where \{"role":"riftcarver"\} could not query: Error: connect ECONNREFUSED$/u,
      );
    });

    it('INVALID: {query resolves [] under expect "some"} => throws HydrationFilterExpectationError', async () => {
      opFilterApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'operation',
        routes: { write: (): unknown => undefined, query: (): unknown => [] },
      });
      const op = OpFilterStub({ where: { role: 'riftcarver' }, expect: 'some', ops: [] });
      const state = HydrationRunStateStub({});

      await expect(
        opFilterApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(HydrationFilterExpectationError);

      await expect(
        opFilterApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "operation" filter where \{"role":"riftcarver"\} expected "some" but matched 0 row\(s\)$/u,
      );
    });

    it('INVALID: {query resolves multiple rows under expect "one"} => throws HydrationFilterExpectationError with candidates', async () => {
      opFilterApplyLayerBrokerProxy();
      const records: Record<string, unknown>[] = [];
      records.push({ id: 'op-1', role: 'riftcarver' });
      records.push({ id: 'op-2', role: 'riftcarver' });
      const config = IngredientConfigStub({
        name: 'operation',
        routes: { write: (): unknown => undefined, query: (): unknown => records },
      });
      const op = OpFilterStub({ where: { role: 'riftcarver' }, expect: 'one', ops: [] });
      const state = HydrationRunStateStub({});

      const caughtError = (await opFilterApplyLayerBroker({
        op,
        target: HydrationTargetStub({}),
        config,
        state,
      }).catch((error: unknown) => error)) as HydrationFilterExpectationError;

      expect({
        name: caughtError.name,
        message: caughtError.message,
        candidates: caughtError.candidates,
      }).toStrictEqual({
        name: 'HydrationFilterExpectationError',
        message:
          'recipe "guild-mid-execution": ingredient "operation" filter where {"role":"riftcarver"} expected "one" but matched 2 row(s)\nCandidates (2):\n  [0]: {"id":"op-1","role":"riftcarver"}\n  [1]: {"id":"op-2","role":"riftcarver"}',
        candidates: records,
      });
    });
  });

  describe('a filter over rows a TRANSITION in the same walk just minted', () => {
    it('VALID: {a transition mints an operation, then a filter matches it} => the saved record is what the transition produced', async () => {
      opFilterApplyLayerBrokerProxy();
      const operationsStore: Record<string, unknown>[] = [];
      const questConfig = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (): unknown => {
            operationsStore.push({ id: 'op1', role: 'riftcarver' });
            return { id: 'q1', status: 'in_progress' };
          },
        }),
      });
      const operationConfig = IngredientConfigStub({
        name: 'operation',
        routes: {
          write: (): unknown => undefined,
          query: ({ where }: { where: Record<string, unknown> }): unknown =>
            operationsStore.filter((row) => row.role === where.role),
        },
      });
      const target = HydrationTargetStub({});
      const state = HydrationRunStateStub({});
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), { id: 'q1', status: 'created' });

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

      const filterOp = OpFilterStub({
        ingredient: 'operation',
        where: { role: 'riftcarver' },
        expect: 'one',
        matchedRef: 'operation[match]',
        ops: [OpSaveRecordStub({ ref: 'operation[match]', name: 'minted' })],
      });

      await opFilterApplyLayerBroker({ op: filterOp, target, config: operationConfig, state });

      expect(state.saved.get('minted' as never)).toStrictEqual({ id: 'op1', role: 'riftcarver' });
    });
  });

  describe('scope — proved against a plan holding two parents', () => {
    it('VALID: {a filter under quest[0], matching rows exist under quest[1] too} => only quest[0]’s row is matched and removed', async () => {
      opFilterApplyLayerBrokerProxy();
      const operationsStore: Record<string, unknown>[] = [];
      operationsStore.push({ id: 'op1', questId: 'q0' });
      operationsStore.push({ id: 'op2', questId: 'q1' });
      const removedIds: string[] = [];
      let receivedWhere: unknown = null;
      const operationConfig = IngredientConfigStub({
        name: 'operation',
        links: [LinkSpecStub({ of: 'quest', as: 'questId' })],
        routes: {
          write: (): unknown => undefined,
          query: ({ where }: { where: Record<string, unknown> }): unknown => {
            receivedWhere = where;
            return operationsStore.filter((row) => row.questId === where.questId);
          },
          remove: ({ record }: { record: Record<string, unknown> }): unknown => {
            removedIds.push(record.id as string);
            return undefined;
          },
        },
      });
      const target = HydrationTargetStub({});
      const state = HydrationRunStateStub({});
      const scope = RowRefStub({ value: 'guild[0:0]/quest[0:0]' });
      state.records.set(scope, { id: 'q0' });
      state.records.set(RowRefStub({ value: 'guild[0:0]/quest[0:1]' }), { id: 'q1' });

      const filterOp = OpFilterStub({
        ingredient: 'operation',
        scope,
        where: {},
        expect: 'one',
        matchedRef: 'guild[0:0]/quest[0:0]/operation[match]',
        ops: [OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]/operation[match]' })],
      });

      await opFilterApplyLayerBroker({ op: filterOp, target, config: operationConfig, state });

      expect(receivedWhere).toStrictEqual({ questId: 'q0' });
      expect(removedIds).toStrictEqual(['op1']);
    });
  });

  describe('two sibling filters sharing a scope and an ingredient — the specification’s own worked example', () => {
    it('VALID: {two filters, different where, each with its own nested saveRecordAs} => each op reached only the rows its OWN filter matched', async () => {
      opFilterApplyLayerBrokerProxy();
      const operationsStore: Record<string, unknown>[] = [];
      operationsStore.push({ id: 'op1', role: 'riftcarver' });
      operationsStore.push({ id: 'op2', role: 'healer' });
      const operationConfig = IngredientConfigStub({
        name: 'operation',
        routes: {
          write: (): unknown => undefined,
          query: ({ where }: { where: Record<string, unknown> }): unknown =>
            operationsStore.filter((row) => row.role === where.role),
        },
      });
      const target = HydrationTargetStub({});
      const state = HydrationRunStateStub({});

      // Both filters share the ingredient and have no scope, so `matchedRefTransformer` derives
      // the IDENTICAL placeholder for both — the collision 4b names, proved harmless here.
      const riftcarverFilter = OpFilterStub({
        ingredient: 'operation',
        where: { role: 'riftcarver' },
        expect: 'one',
        matchedRef: 'operation[match]',
        ops: [OpSaveRecordStub({ ref: 'operation[match]', name: 'riftcarverRow' })],
      });
      const healerFilter = OpFilterStub({
        ingredient: 'operation',
        where: { role: 'healer' },
        expect: 'one',
        matchedRef: 'operation[match]',
        ops: [OpSaveRecordStub({ ref: 'operation[match]', name: 'healerRow' })],
      });

      await opFilterApplyLayerBroker({
        op: riftcarverFilter,
        target,
        config: operationConfig,
        state,
      });
      await opFilterApplyLayerBroker({ op: healerFilter, target, config: operationConfig, state });

      expect(state.saved.get('riftcarverRow' as never)).toStrictEqual({
        id: 'op1',
        role: 'riftcarver',
      });
      expect(state.saved.get('healerRow' as never)).toStrictEqual({ id: 'op2', role: 'healer' });
    });
  });

  describe('a matched row that gets removed — proof by reading state back, not by a function having run', () => {
    it('VALID: {filter matches one row, nested remove} => the row is gone when the same query runs again', async () => {
      opFilterApplyLayerBrokerProxy();
      let operationsStore: Record<string, unknown>[] = [];
      operationsStore.push({ id: 'op1', role: 'riftcarver' });
      const queryRoute = ({ where }: { where: Record<string, unknown> }): unknown =>
        operationsStore.filter((row) => row.role === where.role);
      const operationConfig = IngredientConfigStub({
        name: 'operation',
        routes: {
          write: (): unknown => undefined,
          query: queryRoute,
          remove: ({ record }: { record: Record<string, unknown> }): unknown => {
            operationsStore = operationsStore.filter((row) => row.id !== record.id);
            return undefined;
          },
        },
      });
      const target = HydrationTargetStub({});
      const state = HydrationRunStateStub({});
      const filterOp = OpFilterStub({
        ingredient: 'operation',
        where: { role: 'riftcarver' },
        expect: 'one',
        matchedRef: 'operation[match]',
        ops: [OpRemoveStub({ ref: 'operation[match]' })],
      });

      await opFilterApplyLayerBroker({ op: filterOp, target, config: operationConfig, state });

      expect(queryRoute({ where: { role: 'riftcarver' } })).toStrictEqual([]);
    });
  });

  describe('a create nested in a filter over a DIFFERENT ingredient', () => {
    it('VALID: {filter over quest, nested create of operation} => the operation route ran and its own real record was saved, not the quest route’s', async () => {
      opFilterApplyLayerBrokerProxy();
      const operationWrites: Record<string, unknown>[] = [];
      const questConfig = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => ({ id: 'WRONG-quest-route-ran', title: 'Quest' }),
          query: (): unknown => [{ id: 'q-1', title: 'Quest 1' }],
        },
      });
      const operationConfig = IngredientConfigStub({
        name: 'operation',
        routes: {
          write: ({ fields }: { fields: Record<string, unknown> }): unknown => {
            const title = String(fields.title);
            operationWrites.push({ id: 'op-1', title });
            return { id: 'op-1', title };
          },
        },
      });
      const target = HydrationTargetStub({});
      const state = HydrationRunStateStub({});
      const filterOp = OpFilterStub({
        ingredient: 'quest',
        where: {},
        expect: 'one',
        matchedRef: 'quest[match]',
        ops: [
          OpCreateStub({
            ingredient: 'operation',
            ref: 'quest[match]/operation[0:0]',
            index: 0,
            ancestors: ['quest[match]'],
            fields: { title: 'Ward Operation' },
          }),
          OpSaveRecordStub({ ref: 'quest[match]/operation[0:0]', name: 'nestedCreateResult' }),
        ],
      });

      await opFilterApplyLayerBroker({
        op: filterOp,
        target,
        config: questConfig,
        ingredients: [questConfig, operationConfig],
        state,
      });

      expect(operationWrites).toStrictEqual([{ id: 'op-1', title: 'Ward Operation' }]);
      expect(state.saved.get('nestedCreateResult' as never)).toStrictEqual({
        id: 'op-1',
        title: 'Ward Operation',
      });
    });
  });

  describe('a nested op names an ingredient no config here registers', () => {
    it('ERROR: {nested create names an unregistered ingredient} => throws HydrationNestedIngredientUnregisteredError', async () => {
      opFilterApplyLayerBrokerProxy();
      const questConfig = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => ({ id: 'q-1', title: 'Quest' }),
          query: (): unknown => [{ id: 'q-1', title: 'Quest 1' }],
        },
      });
      const target = HydrationTargetStub({});
      const state = HydrationRunStateStub({});
      const filterOp = OpFilterStub({
        ingredient: 'quest',
        where: {},
        expect: 'one',
        matchedRef: 'quest[match]',
        ops: [
          OpCreateStub({
            ingredient: 'operation',
            ref: 'quest[match]/operation[0:0]',
            index: 0,
            ancestors: ['quest[match]'],
            fields: {},
          }),
        ],
      });

      await expect(
        opFilterApplyLayerBroker({
          op: filterOp,
          target,
          config: questConfig,
          ingredients: [questConfig],
          state,
        }),
      ).rejects.toThrow(HydrationNestedIngredientUnregisteredError);

      await expect(
        opFilterApplyLayerBroker({
          op: filterOp,
          target,
          config: questConfig,
          ingredients: [questConfig],
          state,
        }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": a nested op inside a filter names ingredient "operation", which this run's ingredients do not include\. Registered ingredient names: quest$/u,
      );
    });
  });
});
