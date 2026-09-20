import { opRemoveApplyLayerBroker } from './op-remove-apply-layer-broker';
import { opRemoveApplyLayerBrokerProxy } from './op-remove-apply-layer-broker.proxy';
import { OpRemoveStub } from '../../../contracts/op-remove/op-remove.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';

describe('opRemoveApplyLayerBroker', () => {
  it('VALID: {a remove targeting a created row} => the route received that row’s record', async () => {
    opRemoveApplyLayerBrokerProxy();
    let receivedArgs: unknown = null;
    const config = IngredientConfigStub({
      name: 'operation',
      routes: {
        write: (): unknown => undefined,
        remove: (args: unknown): unknown => {
          receivedArgs = args;
          return undefined;
        },
      },
    });
    const state = HydrationRunStateStub({});
    const ref = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[0:0]' });
    state.records.set(ref, { id: 'op1', role: 'riftcarver' });
    const op = OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]/operation[0:0]' });

    await opRemoveApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

    expect(receivedArgs).toStrictEqual({
      target: HydrationTargetStub({}),
      record: { id: 'op1', role: 'riftcarver' },
    });
  });

  it('VALID: {a remove} => the row is gone from the walk’s state', async () => {
    opRemoveApplyLayerBrokerProxy();
    const config = IngredientConfigStub({
      name: 'operation',
      routes: { write: (): unknown => undefined, remove: (): unknown => undefined },
    });
    const state = HydrationRunStateStub({});
    const ref = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[0:0]' });
    state.records.set(ref, { id: 'op1', role: 'riftcarver' });
    const op = OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]/operation[0:0]' });

    await opRemoveApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

    expect(state.records.has(ref)).toBe(false);
  });

  it('VALID: {a remove targeting a parent row} => removes its descendant records from state.records', async () => {
    opRemoveApplyLayerBrokerProxy();
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: { write: (): unknown => undefined, remove: (): unknown => undefined },
    });
    const questConfig = IngredientConfigStub({
      name: 'quest',
      routes: { write: (): unknown => undefined, remove: (): unknown => undefined },
    });
    const operationConfig = IngredientConfigStub({
      name: 'operation',
      routes: { write: (): unknown => undefined, remove: (): unknown => undefined },
    });
    const state = HydrationRunStateStub({});
    const parentRef = RowRefStub({ value: 'guild[0:0]' });
    const childRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]' });
    const grandchildRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[0:0]' });
    const siblingRef = RowRefStub({ value: 'guild[0:1]' });

    state.records.set(parentRef, { id: 'g1' });
    state.records.set(childRef, { id: 'q1' });
    state.records.set(grandchildRef, { id: 'op1' });
    state.records.set(siblingRef, { id: 'g2' });

    const op = OpRemoveStub({ ref: 'guild[0:0]' });

    await opRemoveApplyLayerBroker({
      op,
      target: HydrationTargetStub({}),
      config: guildConfig,
      ingredients: [guildConfig, questConfig, operationConfig],
      state,
    });

    expect([...state.records.keys()]).toStrictEqual([siblingRef]);
  });

  it('VALID: {a remove targeting a parent row} => calls child routes.remove in reverse-depth order before parent routes.remove', async () => {
    opRemoveApplyLayerBrokerProxy();
    const recordedActions: string[] = [];
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: {
        write: (): unknown => undefined,
        remove: (): unknown => {
          recordedActions.push('guild');
          return undefined;
        },
      },
    });
    const questConfig = IngredientConfigStub({
      name: 'quest',
      routes: {
        write: (): unknown => undefined,
        remove: (): unknown => {
          recordedActions.push('quest');
          return undefined;
        },
      },
    });
    const operationConfig = IngredientConfigStub({
      name: 'operation',
      routes: {
        write: (): unknown => undefined,
        remove: (): unknown => {
          recordedActions.push('operation');
          return undefined;
        },
      },
    });
    const state = HydrationRunStateStub({});
    const parentRef = RowRefStub({ value: 'guild[0:0]' });
    const childRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]' });
    const grandchildRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[0:0]' });

    state.records.set(parentRef, { id: 'g1' });
    state.records.set(childRef, { id: 'q1' });
    state.records.set(grandchildRef, { id: 'op1' });

    const op = OpRemoveStub({ ref: 'guild[0:0]' });

    await opRemoveApplyLayerBroker({
      op,
      target: HydrationTargetStub({}),
      config: guildConfig,
      ingredients: [guildConfig, questConfig, operationConfig],
      state,
    });

    expect(recordedActions).toStrictEqual(['operation', 'quest', 'guild']);
  });
});
