// B7 — two TOP-LEVEL `add` calls of the same ingredient, in one plan. The chunk-12 plan predicts
// both guilds mint `guild[0]` and collide wholesale. Run in isolation (a fresh `dm`, no other
// `.add()` call against it first) so the ref numbers read as the canonical base case.
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { guildIngredient, questIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';

const dm = entryChainTransformer({ registry: { guilds: guildIngredient, quests: questIngredient } });

const createRefs = (ops: readonly unknown[]): readonly unknown[] =>
  ops
    .flat(Infinity as never)
    .filter((op) => (op as Record<PropertyKey, unknown>).op === 'create')
    .map((op) => (op as Record<PropertyKey, unknown>).ref);

const b7First = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'topA' })]),
]) as unknown as readonly unknown[];
const b7Second = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'topB' })]),
]) as unknown as readonly unknown[];
const b7Ops = [...b7First, ...b7Second];

console.log('B7 refs (create ops only):', JSON.stringify(createRefs(b7Ops)));

// The sharper consequence Table 2/B7 names: does a filter SCOPED to the first guild's quest ever
// see the second guild's quest? Exercised by B4/B8's own scope mechanism, not re-driven here — see
// b4.ts.
