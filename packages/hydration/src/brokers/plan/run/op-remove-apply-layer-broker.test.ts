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
});
