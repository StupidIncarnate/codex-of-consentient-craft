// B3 — an `add` inside an `add` inside an `add`, each with its own `defaults`. Marked CONFIRM in
// the plan: collection-chain-transformer's own test already asserts the index restarts at 0 per
// `add`. This drives the plan's own three-level example against the real repo ingredients
// (guild -> quest -> operation) rather than reading the unit test alone.
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import {
  guildIngredient,
  questIngredient,
  operationIngredient,
} from '../../packages/hydration/test/type-fixtures/dm-target';

const NESTED_COUNT = 2;

const dm = entryChainTransformer({
  registry: { guilds: guildIngredient, quests: questIngredient, operations: operationIngredient },
});

const ops = dm.guilds.add(NESTED_COUNT, (g) => [
  g[0].quests.add(NESTED_COUNT, (q) => [q[0].operations.add(NESTED_COUNT, () => [])]),
]) as unknown as readonly unknown[];

const flat = ops.flat(Infinity as never) as readonly Record<PropertyKey, unknown>[];
const creates = flat.filter((op) => op.op === 'create');
console.log(
  'create ops (ingredient, ref, index, fields):',
  JSON.stringify(creates.map((op) => ({ ingredient: op.ingredient, ref: op.ref, index: op.index, fields: op.fields }))),
);
