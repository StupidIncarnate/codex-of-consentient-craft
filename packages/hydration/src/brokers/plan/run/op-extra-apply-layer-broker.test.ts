import { opExtraApplyLayerBroker } from './op-extra-apply-layer-broker';
import { opExtraApplyLayerBrokerProxy } from './op-extra-apply-layer-broker.proxy';
import { OpExtraStub } from '../../../contracts/op-extra/op-extra.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';
import { nestedChainArgsContract } from '../../../../test/type-fixtures/dm-target';

describe('opExtraApplyLayerBroker', () => {
  it('VALID: {an extra verb declared on the ingredient} => apply received target, record and args', async () => {
    opExtraApplyLayerBrokerProxy();
    let receivedArgs: unknown = null;
    const config = IngredientConfigStub({
      name: 'session',
      extras: {
        withNestedChain: {
          args: nestedChainArgsContract,
          apply: (args: unknown): unknown => {
            receivedArgs = args;
            return undefined;
          },
        },
      },
    });
    const state = HydrationRunStateStub({});
    const ref = RowRefStub({ value: 'guild[0:0]/session[0:0]' });
    state.records.set(ref, { sessionId: 's1', url: 'x' });
    const op = OpExtraStub({
      ref: 'guild[0:0]/session[0:0]',
      verb: 'withNestedChain',
      args: { depth: 2 },
    });

    await opExtraApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

    expect(receivedArgs).toStrictEqual({
      target: HydrationTargetStub({}),
      record: { sessionId: 's1', url: 'x' },
      args: { depth: 2 },
    });
  });

  it('VALID: {an extra whose args carry a SavedRef} => apply received the resolved value', async () => {
    opExtraApplyLayerBrokerProxy();
    let receivedArgs: unknown = null;
    const config = IngredientConfigStub({
      name: 'session',
      extras: {
        withNestedChain: {
          args: nestedChainArgsContract,
          apply: (args: unknown): unknown => {
            receivedArgs = args;
            return undefined;
          },
        },
      },
    });
    const state = HydrationRunStateStub({});
    state.saved.set('origin' as never, { depth: 3 });
    const op = OpExtraStub({
      ref: 'guild[0:0]/session[0:0]',
      verb: 'withNestedChain',
      args: { depth: { __savedRef: true, name: 'origin', field: 'depth' } as never },
    });

    await opExtraApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state });

    expect(receivedArgs).toStrictEqual({
      target: HydrationTargetStub({}),
      record: {},
      args: { depth: 3 },
    });
  });
});
