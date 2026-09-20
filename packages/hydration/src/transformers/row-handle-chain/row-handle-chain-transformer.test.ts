import { rowHandleChainTransformer } from './row-handle-chain-transformer';
import {
  guildIngredient,
  guildFieldsContract,
  questIngredient,
  operationIngredient,
  operationFieldsContract,
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

  it('VALID: {q[0] minted under a supplied guildId, then q[0].operations.add(1, () => [])} => the grandchild row carries the cascaded guildId', () => {
    const handle = rowHandleChainTransformer<
      typeof questIngredient,
      {
        guilds: typeof guildIngredient;
        quests: typeof questIngredient;
        operations: typeof operationIngredient;
        sessions: typeof sessionIngredient;
      },
      [typeof guildIngredient]
    >({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ref: RowRefStub({ value: 'quest[0:0]' }),
      ancestors: [],
      ancestorNames: ['guild'] as never,
      under: { guildId: 'guild-1' },
    });

    const result = handle.operations.add(1, () => []) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'create',
        ingredient: 'operation',
        ref: 'quest[0:0]/operation[0:0]',
        index: 0,
        ancestors: ['quest[0:0]'],
        fields: { guildId: 'guild-1' },
      },
    ]);
  });

  it('VALID: {q[0] minted under a supplied guildId, then q[0].operations.under({guildId: other}).add(1, () => [])} => the descendant’s own explicit id wins over the cascaded one', () => {
    const handle = rowHandleChainTransformer<
      typeof questIngredient,
      {
        guilds: typeof guildIngredient;
        quests: typeof questIngredient;
        operations: typeof operationIngredient;
        sessions: typeof sessionIngredient;
      },
      [typeof guildIngredient]
    >({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ref: RowRefStub({ value: 'quest[0:0]' }),
      ancestors: [],
      ancestorNames: ['guild'] as never,
      under: { guildId: 'cascaded-guild' },
    });

    const result = handle.operations
      .under({ guildId: operationFieldsContract.shape.guildId.parse('explicit-guild') })
      .add(1, () => []) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'create',
        ingredient: 'operation',
        ref: 'quest[0:0]/operation[0:0]',
        index: 0,
        ancestors: ['quest[0:0]'],
        fields: { guildId: 'explicit-guild' },
      },
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
