// B6 — two sibling `add` calls under ONE HOST. B7 — two TOP-LEVEL `add` calls of the same
// ingredient. The chunk-12 plan predicts both COLLIDE (same ref minted twice, second overwrites
// first) via `row-ref-transformer.ts`'s OLD `[...ancestors, ingredient[index]]` shape. The shipped
// transformer now folds a `callIndex` into every ref (`ingredient[callIndex:index]`), so this script
// checks whether that already closes the case the plan still describes as open.
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { guildIngredient, questIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';

const PAIR_SIZE = 2;

const dm = entryChainTransformer({ registry: { guilds: guildIngredient, quests: questIngredient } });

const createRefs = (ops: readonly unknown[]): readonly unknown[] =>
  ops
    .flat(Infinity as never)
    .filter((op) => (op as Record<PropertyKey, unknown>).op === 'create')
    .map((op) => (op as Record<PropertyKey, unknown>).ref);

// B6 — two sibling add(2, ...) calls under the SAME host (g[0].quests), each saveRecordAs-ing its
// own pair.
const b6Ops = dm.guilds.add(1, (g) => [
  g[0].quests.add(PAIR_SIZE, (q) => [
    q[0].saveRecordAs({ name: 'firstPair0' }),
    q[1].saveRecordAs({ name: 'firstPair1' }),
  ]),
  g[0].quests.add(PAIR_SIZE, (q) => [
    q[0].saveRecordAs({ name: 'secondPair0' }),
    q[1].saveRecordAs({ name: 'secondPair1' }),
  ]),
]) as unknown as readonly unknown[];

console.log('B6 refs (create ops only):', JSON.stringify(createRefs(b6Ops)));

// B7 — two TOP-LEVEL add(1, ...) calls of `guilds`, in one plan.
const b7First = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'topA' })]),
]) as unknown as readonly unknown[];
const b7Second = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'topB' })]),
]) as unknown as readonly unknown[];
const b7Ops = [...b7First, ...b7Second];

console.log('B7 refs (create ops only):', JSON.stringify(createRefs(b7Ops)));
