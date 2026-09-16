import { rowHandleChainTransformer } from './row-handle-chain-transformer';
import {
  guildIngredient,
  guildFieldsContract,
  questIngredient,
  operationIngredient,
  sessionIngredient,
} from '../../../test/type-fixtures/dm-target';
import type { IngredientConfigStub } from '../../contracts/ingredient-config/ingredient-config.stub';
import type { HydrationOpStub } from '../../contracts/hydration-op/hydration-op.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';

type IngredientConfigData = ReturnType<typeof IngredientConfigStub>;
type HydrationOp = ReturnType<typeof HydrationOpStub>;

describe('rowHandleChainTransformer', () => {
  it('VALID: {g[0].set({name: "Siege"})} => returns one set op with written {name: "Siege"}', () => {
    const handle = rowHandleChainTransformer<typeof guildIngredient>({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
      ingredientConfig: guildIngredient as unknown as IngredientConfigData,
      ref: RowRefStub({ value: 'guild[0:0]' }),
      ancestors: [],
      ancestorNames: [],
    });

    const result = handle.set({
      name: guildFieldsContract.shape.name.parse('Siege'),
    }) as unknown as HydrationOp[];

    expect(result).toStrictEqual([{ op: 'set', ref: 'guild[0:0]', written: { name: 'Siege' } }]);
  });

  it('VALID: {g[0].quests.add(1, () => [])} => the created row is scoped under guild[0:0]', () => {
    const handle = rowHandleChainTransformer<
      typeof guildIngredient,
      {
        guilds: typeof guildIngredient;
        quests: typeof questIngredient;
        operations: typeof operationIngredient;
        sessions: typeof sessionIngredient;
      }
    >({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
      ingredientConfig: guildIngredient as unknown as IngredientConfigData,
      ref: RowRefStub({ value: 'guild[0:0]' }),
      ancestors: [],
      ancestorNames: [],
    });

    const result = handle.quests.add(1, () => []) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'guild[0:0]/quest[0:0]',
        index: 0,
        ancestors: ['guild[0:0]'],
        fields: { title: 'Quest 1' },
      },
    ]);
  });

  it('VALID: {q[0] on a quest} => carries operations (links to quest+guild, both ancestors) but not sessions (links to guild only, a sibling not an ancestor), asserted on the whole runtime key set', () => {
    const handle = rowHandleChainTransformer<typeof questIngredient>({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ref: RowRefStub({ value: 'guild[0:0]/quest[0:0]' }),
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ancestorNames: ['guild'] as never,
    });

    expect(Object.keys(handle).sort()).toStrictEqual([
      'ingredient',
      'operations',
      'ref',
      'remove',
      'saveRecordAs',
      'set',
      'setRaw',
    ]);
  });

  it('VALID: {s[0].withNestedChain({depth: 2})} => returns one extra op', () => {
    const handle = rowHandleChainTransformer<typeof sessionIngredient>({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
      ingredientConfig: sessionIngredient as unknown as IngredientConfigData,
      ref: RowRefStub({ value: 'guild[0:0]/session[0:0]' }),
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ancestorNames: ['guild'] as never,
    });

    const result = handle.withNestedChain({ depth: 2 }) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      { op: 'extra', ref: 'guild[0:0]/session[0:0]', verb: 'withNestedChain', args: { depth: 2 } },
    ]);
  });
});
