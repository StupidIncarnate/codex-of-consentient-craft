import { collectionChainTransformer } from './collection-chain-transformer';
import { questIngredient, questFieldsContract } from '../../../test/type-fixtures/dm-target';
import type { IngredientConfigStub } from '../../contracts/ingredient-config/ingredient-config.stub';
import type { HydrationOpStub } from '../../contracts/hydration-op/hydration-op.stub';

type IngredientConfigData = ReturnType<typeof IngredientConfigStub>;
type HydrationOp = ReturnType<typeof HydrationOpStub>;

describe('collectionChainTransformer', () => {
  it('VALID: {add(3, (q, all) => [all.set(...), q[0].set(...)])} => returns three create ops then four set ops, in declaration order', () => {
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const result = collection.add(3, (q, all) => [
      all.set({ userRequest: questFieldsContract.shape.userRequest.parse('seeded') }),
      q[0].set({ title: questFieldsContract.shape.title.parse('first') }),
    ]) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'Quest 1' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:1]',
        index: 1,
        ancestors: [],
        fields: { title: 'Quest 2' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:2]',
        index: 2,
        ancestors: [],
        fields: { title: 'Quest 3' },
      },
      { op: 'set', ref: 'quest[0:0]', written: { userRequest: 'seeded' } },
      { op: 'set', ref: 'quest[0:1]', written: { userRequest: 'seeded' } },
      { op: 'set', ref: 'quest[0:2]', written: { userRequest: 'seeded' } },
      { op: 'set', ref: 'quest[0:0]', written: { title: 'first' } },
    ]);
  });

  it('VALID: {add(2, ...) called twice on the same collection} => each call starts its own row index at 0 and 1, but mints DISTINCT refs', () => {
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const firstBatch = collection.add(2, (q) => [
      q[0].saveRecordAs({ name: 'a0' }),
      q[1].saveRecordAs({ name: 'a1' }),
    ]) as unknown as HydrationOp[];
    const secondBatch = collection.add(2, (q) => [
      q[0].saveRecordAs({ name: 'b0' }),
      q[1].saveRecordAs({ name: 'b1' }),
    ]) as unknown as HydrationOp[];

    expect(firstBatch).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'Quest 1' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:1]',
        index: 1,
        ancestors: [],
        fields: { title: 'Quest 2' },
      },
      { op: 'saveRecord', ref: 'quest[0:0]', name: 'a0' },
      { op: 'saveRecord', ref: 'quest[0:1]', name: 'a1' },
    ]);
    expect(secondBatch).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[1:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'Quest 1' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[1:1]',
        index: 1,
        ancestors: [],
        fields: { title: 'Quest 2' },
      },
      { op: 'saveRecord', ref: 'quest[1:0]', name: 'b0' },
      { op: 'saveRecord', ref: 'quest[1:1]', name: 'b1' },
    ]);
  });

  it('VALID: {add(3, () => [])} => the three create ops carry Quest 1, Quest 2, Quest 3 from defaults(index)', () => {
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const result = collection.add(3, () => []) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'Quest 1' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:1]',
        index: 1,
        ancestors: [],
        fields: { title: 'Quest 2' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:2]',
        index: 2,
        ancestors: [],
        fields: { title: 'Quest 3' },
      },
    ]);
  });

  it('VALID: {under({guildId}).add(1, () => [])} => the create op carries guildId from the input, not an ancestor', () => {
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const result = collection
      .under({ guildId: questFieldsContract.shape.guildId.parse('guild-1') })
      .add(1, () => []) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        index: 0,
        ancestors: [],
        fields: { guildId: 'guild-1', title: 'Quest 1' },
      },
    ]);
  });

  it('VALID: {add(1, ...) then filter(...) on the same collection and scope} => the added row and the filter placeholder are distinct refs', () => {
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const added = collection.add(1, (q) => [
      q[0].saveRecordAs({ name: 'added' }),
    ]) as unknown as HydrationOp[];
    const filtered = collection
      .filter({ where: { status: 'queued' } })
      .remove() as unknown as HydrationOp[];

    expect([added[0], filtered[0]]).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'Quest 1' },
      },
      {
        op: 'filter',
        ingredient: 'quest',
        where: { status: 'queued' },
        expect: 'some',
        matchedRef: 'quest[match]',
        ops: [{ op: 'remove', ref: 'quest[match]' }],
      },
    ]);
  });
});
