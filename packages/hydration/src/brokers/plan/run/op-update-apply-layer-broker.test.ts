import { opUpdateApplyLayerBroker } from './op-update-apply-layer-broker';
import { opUpdateApplyLayerBrokerProxy } from './op-update-apply-layer-broker.proxy';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { TransitionSpecStub } from '../../../contracts/transition-spec/transition-spec.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';
import { HydrationRecordShapeError } from '../../../errors/hydration-record-shape/hydration-record-shape-error';
import { HydrationRouteFailedError } from '../../../errors/hydration-route-failed/hydration-route-failed-error';

describe('opUpdateApplyLayerBroker', () => {
  describe('a non-foldable set — the written half goes through the update route', () => {
    it('VALID: {written {title}} => the update route received the current record and the resolved fields', async () => {
      opUpdateApplyLayerBrokerProxy();
      let received: unknown = null;
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          update: ({
            record,
            fields,
          }: {
            record: Record<string, unknown>;
            fields: Record<string, unknown>;
          }): unknown => {
            received = { record, fields };
            return { id: record.id, title: fields.title };
          },
        },
      });
      const state = HydrationRunStateStub({});
      const ref = RowRefStub({ value: 'guild[0:0]/quest[0:0]' });
      state.records.set(ref, { id: 'q1', title: 'Old title' });
      const op = OpSetStub({ ref: 'guild[0:0]/quest[0:0]', written: { title: 'New title' } });

      await opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

      expect(received).toStrictEqual({
        record: { id: 'q1', title: 'Old title' },
        fields: { title: 'New title' },
      });
      expect(state.records.get(ref)).toStrictEqual({ id: 'q1', title: 'New title' });
    });
  });

  describe('written empty, a transition present — delegates to opSetApplyLayerBroker', () => {
    it('VALID: {written: {}, transition to in_progress} => the walked record lands in state', async () => {
      opUpdateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (): unknown => ({ id: 'q1', title: 'Quest 1', status: 'in_progress' }),
        }),
      });
      const state = HydrationRunStateStub({});
      const ref = RowRefStub({ value: 'quest[0:0]' });
      state.records.set(ref, { id: 'q1', title: 'Quest 1', status: 'created' });
      const op = OpSetStub({
        ref: 'quest[0:0]',
        written: {},
        transition: { field: 'status', to: 'in_progress' },
      });

      await opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

      expect(state.records.get(ref)).toStrictEqual({
        id: 'q1',
        title: 'Quest 1',
        status: 'in_progress',
      });
    });
  });

  describe('written empty, no transition — a true no-op', () => {
    it('EMPTY: {written: {}, no transition} => the record is left untouched and no route is called', async () => {
      opUpdateApplyLayerBrokerProxy();
      let updateCallCount = 0;
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          update: (): unknown => {
            updateCallCount += 1;
            return { id: 'q1', title: 'Quest 1' };
          },
        },
      });
      const state = HydrationRunStateStub({});
      const ref = RowRefStub({ value: 'quest[0:0]' });
      state.records.set(ref, { id: 'q1', title: 'Quest 1' });
      const op = OpSetStub({ ref: 'quest[0:0]', written: {} });

      await opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

      expect(updateCallCount).toBe(0);
      expect(state.records.get(ref)).toStrictEqual({ id: 'q1', title: 'Quest 1' });
    });
  });

  describe('a non-foldable set carrying both halves — the transition walks the ALREADY-updated record', () => {
    it('VALID: {written {title} and a transition} => reach receives the record with the new title, not the old one', async () => {
      opUpdateApplyLayerBrokerProxy();
      let receivedRecord: unknown = null;
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          update: ({
            record,
            fields,
          }: {
            record: Record<string, unknown>;
            fields: Record<string, unknown>;
          }): unknown => ({ id: record.id, title: fields.title }),
        },
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: ({ record }: { record: unknown }): unknown => {
            receivedRecord = record;
            return { id: 'q1', title: 'New title', status: 'in_progress' };
          },
        }),
      });
      const state = HydrationRunStateStub({});
      const ref = RowRefStub({ value: 'quest[0:0]' });
      state.records.set(ref, { id: 'q1', title: 'Old title' });
      const op = OpSetStub({
        ref: 'quest[0:0]',
        written: { title: 'New title' },
        transition: { field: 'status', to: 'in_progress' },
      });

      await opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

      expect(receivedRecord).toStrictEqual({ id: 'q1', title: 'New title' });
    });
  });

  describe('the update route fails', () => {
    it('ERROR: {update route rejects} => throws HydrationRouteFailedError naming the "update" route', async () => {
      opUpdateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          update: (): unknown => {
            throw new Error('connect ECONNREFUSED');
          },
        },
      });
      const state = HydrationRunStateStub({});
      const op = OpSetStub({ ref: 'quest[0:0]', written: { title: 'New title' } });

      await expect(
        opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(HydrationRouteFailedError);

      await expect(
        opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "quest"'s "update" route refused the connection with no URL known: Error: connect ECONNREFUSED$/u,
      );
    });
  });

  describe('the route returns a shape "record" rejects', () => {
    it('ERROR: {update route returns {title} with no id} => throws HydrationRecordShapeError naming "id"', async () => {
      opUpdateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: (): unknown => undefined,
          update: (): unknown => ({ title: 'New title' }),
        },
      });
      const state = HydrationRunStateStub({});
      const op = OpSetStub({ ref: 'quest[0:0]', written: { title: 'New title' } });

      await expect(
        opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(HydrationRecordShapeError);

      await expect(
        opUpdateApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "quest"'s "update" route answered 2xx with a record that field "id" rejects: Required$/u,
      );
    });
  });
});
