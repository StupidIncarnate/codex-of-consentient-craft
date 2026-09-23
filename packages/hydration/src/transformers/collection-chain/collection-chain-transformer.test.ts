import { collectionChainTransformer } from './collection-chain-transformer';
import {
  questIngredient,
  questFieldsContract,
  operationIngredient,
} from '../../../test/type-fixtures/dm-target';
import type { IngredientConfigStub } from '../../contracts/ingredient-config/ingredient-config.stub';
import type { HydrationOpStub } from '../../contracts/hydration-op/hydration-op.stub';

type IngredientConfigData = ReturnType<typeof IngredientConfigStub>;
type HydrationOp = ReturnType<typeof HydrationOpStub>;
// A row handle's own child accessors are computed at RUN TIME off plain object keys —
// `rowHandleChainTransformer` never reads a static type — so a test may reach a child this way
// without needing the static `Handle<R, I, Anc>` (unreachable here: `Anc` grows from `attach`'s
// own generic `Ids`, which the file-level note below explains cannot be named from a `.test.ts`
// file at all, since test files may not import from `contracts/`).
type LooseHandle = Record<string, unknown> & {
  operations: { add: (count: number, build: () => readonly HydrationOp[]) => HydrationOp };
};

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

  it('VALID: {attach({id}, (row) => [row.saveRecordAs(...)])} => returns the attach op followed by the builder’s own ops', () => {
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const result = collection.attach({ id: 'q1' }, (row) => [
      row.saveRecordAs({ name: 'attached' }),
    ]) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      { op: 'attach', ingredient: 'quest', ref: 'quest[0:0]', ancestors: [], where: { id: 'q1' } },
      { op: 'saveRecord', ref: 'quest[0:0]', name: 'attached' },
    ]);
  });

  it('VALID: {add(1, ...) then attach({id}, ...) on the same collection} => each call draws the next CallIndex, minting distinct refs', () => {
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const added = collection.add(1, (q) => [
      q[0].saveRecordAs({ name: 'minted' }),
    ]) as unknown as HydrationOp[];
    const attached = collection.attach({ id: 'q1' }, (row) => [
      row.saveRecordAs({ name: 'attached' }),
    ]) as unknown as HydrationOp[];

    expect([added[0], attached[0]]).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'Quest 1' },
      },
      { op: 'attach', ingredient: 'quest', ref: 'quest[1:0]', ancestors: [], where: { id: 'q1' } },
    ]);
  });

  it('VALID: {attach({id, guildId}), builder reaches a child accessor via LooseHandle} => guildId merges into the child’s own create fields, same as under()', () => {
    // `Handle<R, I, [...Anc, UnderAncestor<I, Ids>]>` — the STATIC type `attach`'s own builder
    // parameter promises here — cannot be named from this file (test files may not import
    // `contracts/`, and even inside a non-test file the mapped `ChildAccessors` type does not
    // resolve a key contributed by a GENERIC `Ids` at this compile-time depth; see
    // `packages/hydration/CLAUDE.md`'s "`.under()` does not carry ancestor names forward for child
    // accessors" section, which documents the identical limitation for `under()`). `operations` is
    // a REAL key on the object `rowHandleChainTransformer` builds regardless — child accessors are
    // computed off plain `Object.entries` at RUN TIME — so `LooseHandle` reaches it honestly.
    const collection = collectionChainTransformer<typeof questIngredient>({
      registry: { quests: questIngredient, operations: operationIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const attachWithLooseBuilder = collection.attach as unknown as (
      where: Record<string, unknown>,
      build: (row: LooseHandle) => readonly HydrationOp[],
    ) => HydrationOp;

    const result = attachWithLooseBuilder(
      { id: 'q1', guildId: questFieldsContract.shape.guildId.parse('guild-1') },
      (row) => [row.operations.add(1, () => [])],
    ) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'attach',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        ancestors: [],
        where: { id: 'q1', guildId: 'guild-1' },
      },
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
