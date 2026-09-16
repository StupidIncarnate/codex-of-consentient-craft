import { matchedSetChainTransformer } from './matched-set-chain-transformer';
import {
  operationIngredient,
  operationFieldsContract,
  sessionIngredient,
} from '../../../test/type-fixtures/dm-target';
import type { IngredientConfigStub } from '../../contracts/ingredient-config/ingredient-config.stub';
import type { HydrationOpStub } from '../../contracts/hydration-op/hydration-op.stub';
import { IngredientNameStub } from '../../contracts/ingredient-name/ingredient-name.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';

type IngredientConfigData = ReturnType<typeof IngredientConfigStub>;
type HydrationOp = ReturnType<typeof HydrationOpStub>;

describe('matchedSetChainTransformer', () => {
  it('VALID: {filter over operations}.remove() => returns one filter op wrapping one remove op targeting the derived matchedRef', () => {
    const matched = matchedSetChainTransformer<typeof operationIngredient>({
      ingredientConfig: operationIngredient as unknown as IngredientConfigData,
      ingredient: IngredientNameStub({ value: 'operation' }),
      scope: RowRefStub({ value: 'guild[0:0]/quest[0:0]' }),
      where: { role: 'riftcarver' },
      expect: 'one',
    });

    const result = matched.remove() as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'filter',
        ingredient: 'operation',
        scope: 'guild[0:0]/quest[0:0]',
        where: { role: 'riftcarver' },
        expect: 'one',
        matchedRef: 'guild[0:0]/quest[0:0]/operation[match]',
        ops: [{ op: 'remove', ref: 'guild[0:0]/quest[0:0]/operation[match]' }],
      },
    ]);
  });

  it('VALID: {filter over operations}.set({text: "noop"}) => returns one filter op wrapping one set op, defaulting expect to "some" with no scope key', () => {
    const matched = matchedSetChainTransformer<typeof operationIngredient>({
      ingredientConfig: operationIngredient as unknown as IngredientConfigData,
      ingredient: IngredientNameStub({ value: 'operation' }),
      where: { role: 'ward' },
    });

    const result = matched.set({
      text: operationFieldsContract.shape.text.parse('noop'),
    }) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'filter',
        ingredient: 'operation',
        where: { role: 'ward' },
        expect: 'some',
        matchedRef: 'operation[match]',
        ops: [{ op: 'set', ref: 'operation[match]', written: { text: 'noop' } }],
      },
    ]);
  });

  it('VALID: {an ingredient with an extra}.withNestedChain({depth: 2}) => builds one filter op wrapping one extra op', () => {
    const matched = matchedSetChainTransformer<typeof sessionIngredient>({
      ingredientConfig: sessionIngredient as unknown as IngredientConfigData,
      ingredient: IngredientNameStub({ value: 'session' }),
      where: { guildId: 'guild-1' },
    });

    const result = matched.withNestedChain({ depth: 2 }) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'filter',
        ingredient: 'session',
        where: { guildId: 'guild-1' },
        expect: 'some',
        matchedRef: 'session[match]',
        ops: [{ op: 'extra', ref: 'session[match]', verb: 'withNestedChain', args: { depth: 2 } }],
      },
    ]);
  });
});
