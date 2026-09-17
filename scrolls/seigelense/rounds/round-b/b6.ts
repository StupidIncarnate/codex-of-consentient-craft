// B6 — two sibling `add` calls under ONE HOST mint colliding references? The chunk-12 plan predicts
// a collision (`row-ref-transformer.ts`'s cited shape is `[...ancestors, ingredient[index]]`, no
// call-index). The shipped transformer folds a `callIndex` into every ref instead
// (`ingredient[callIndex:index]`), scoped per collection instance — this checks whether that already
// closes the case.
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { guildIngredient, questIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';

const PAIR_SIZE = 2;

const dm = entryChainTransformer({ registry: { guilds: guildIngredient, quests: questIngredient } });

const createRefs = (ops: readonly unknown[]): readonly unknown[] =>
  ops
    .flat(Infinity as never)
    .filter((op) => (op as Record<PropertyKey, unknown>).op === 'create')
    .map((op) => (op as Record<PropertyKey, unknown>).ref);

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
