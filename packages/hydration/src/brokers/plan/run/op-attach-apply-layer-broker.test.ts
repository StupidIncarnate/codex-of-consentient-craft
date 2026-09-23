import { opAttachApplyLayerBroker } from './op-attach-apply-layer-broker';
import { opAttachApplyLayerBrokerProxy } from './op-attach-apply-layer-broker.proxy';
import { OpAttachStub } from '../../../contracts/op-attach/op-attach.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';
import { HydrationQueryFailedError } from '../../../errors/hydration-query-failed/hydration-query-failed-error';
import type { HydrationFilterExpectationError } from '../../../errors/hydration-filter-expectation/hydration-filter-expectation-error';
import { HydrationRecordShapeError } from '../../../errors/hydration-record-shape/hydration-record-shape-error';

describe('opAttachApplyLayerBroker', () => {
  describe('exactly one row matches', () => {
    it('VALID: {query resolves [{id, title}]} => binds the parsed record onto op.ref', async () => {
      opAttachApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          query: (): unknown => [{ id: 'q1', title: 'Existing quest' }],
        },
      });
      const op = OpAttachStub({ ref: 'quest[0:0]', ancestors: [], where: { id: 'q1' } });
      const state = HydrationRunStateStub({});

      const result = await opAttachApplyLayerBroker({
        op,
        target: HydrationTargetStub({}),
        config,
        state,
      });

      expect(result.records.get(RowRefStub({ value: 'quest[0:0]' }))).toStrictEqual({
        id: 'q1',
        title: 'Existing quest',
      });
    });

    it('VALID: {op.where carries a SavedRef} => resolves it against state.saved before querying', async () => {
      opAttachApplyLayerBrokerProxy();
      let receivedWhere: unknown = null;
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          query: ({ where }: { where: Record<string, unknown> }): unknown => {
            receivedWhere = where;
            return [{ id: 'q1', title: 'Existing quest' }];
          },
        },
      });
      const op = OpAttachStub({
        ref: 'quest[0:0]',
        ancestors: [],
        where: { id: { __savedRef: true, name: 'origin', field: 'questId' } },
      });
      const state = HydrationRunStateStub({
        saved: new Map([['origin' as never, { questId: 'q1' }]]),
      });

      await opAttachApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

      expect(receivedWhere).toStrictEqual({ id: 'q1' });
    });
  });

  describe('the query fails outright, distinct from matching zero rows', () => {
    it('ERROR: {query rejects} => throws HydrationQueryFailedError', async () => {
      opAttachApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          query: (): unknown => {
            throw new Error('connect ECONNREFUSED');
          },
        },
      });
      const op = OpAttachStub({ ref: 'quest[0:0]', ancestors: [], where: { id: 'q1' } });
      const state = HydrationRunStateStub({});

      await expect(
        opAttachApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(HydrationQueryFailedError);
    });
  });

  describe('the match count is not exactly one', () => {
    it('INVALID: {query resolves []} => throws HydrationFilterExpectationError naming "one"', async () => {
      opAttachApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        routes: { write: (): unknown => undefined, query: (): unknown => [] },
      });
      const op = OpAttachStub({ ref: 'quest[0:0]', ancestors: [], where: { id: 'q1' } });
      const state = HydrationRunStateStub({});

      await expect(
        opAttachApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "quest" filter where \{"id":"q1"\} expected "one" but matched 0 row\(s\)$/u,
      );
    });

    it('INVALID: {query resolves two rows} => throws HydrationFilterExpectationError with both candidates', async () => {
      opAttachApplyLayerBrokerProxy();
      const records: Record<string, unknown>[] = [];
      records.push({ id: 'q1', title: 'First' });
      records.push({ id: 'q1', title: 'Duplicate' });
      const config = IngredientConfigStub({
        name: 'quest',
        routes: { write: (): unknown => undefined, query: (): unknown => records },
      });
      const op = OpAttachStub({ ref: 'quest[0:0]', ancestors: [], where: { id: 'q1' } });
      const state = HydrationRunStateStub({});

      const caughtError = (await opAttachApplyLayerBroker({
        op,
        target: HydrationTargetStub({}),
        config,
        state,
      }).catch((error: unknown) => error)) as HydrationFilterExpectationError;

      expect({ name: caughtError.name, candidates: caughtError.candidates }).toStrictEqual({
        name: 'HydrationFilterExpectationError',
        candidates: records,
      });
    });
  });

  describe('the matched row fails the ingredient’s own record shape', () => {
    it('ERROR: {matched row missing "title"} => throws HydrationRecordShapeError naming the "query" route', async () => {
      opAttachApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        routes: { write: (): unknown => undefined, query: (): unknown => [{ id: 'q1' }] },
      });
      const op = OpAttachStub({ ref: 'quest[0:0]', ancestors: [], where: { id: 'q1' } });
      const state = HydrationRunStateStub({});

      await expect(
        opAttachApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(HydrationRecordShapeError);

      await expect(
        opAttachApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "quest"'s "query" route answered 2xx with a record that field "title" rejects: Required$/u,
      );
    });
  });
});
