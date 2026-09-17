// C19 — a `create` op nested inside a `filter`, hand-assembled (not writable through the chain —
// `filter(...).add(...)` does not exist on `Matched<I>`). The plan predicts the op CONTRACT admits
// it (op-filter-contract.ts's OpFilterNestedOp union includes OpCreate) even though the chain
// refuses it — "a divergence between what the chain can express and what the data can carry."
// `op-filter-apply-layer-broker.ts`'s own source already shows the RUNNER has a live branch for
// this ('Matched<I> exposes no add ... kept because OpFilterNestedOp shares all six branches ...
// and a hand-built plan may still carry one'), so this is drivable today, hand-assembling the tree
// directly rather than waiting on `include()`.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { hydrationPlanContract } from '../../packages/hydration/src/contracts/hydration-plan/hydration-plan-contract';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const questStore: Record<PropertyKey, unknown>[] = [{ id: 'q-1', title: 'seed' }];
let opSeq = 0;

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a pre-seeded quest, real query route, no add ever used by this plan',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async () => ({ id: 'unused' }),
    query: async ({ where }: { where: Record<PropertyKey, unknown> }) =>
      questStore.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
  },
  copies: 'x',
} as never);

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'the ingredient the hand-built create op inside the filter targets',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      opSeq += 1;
      return { id: `op-${opSeq}`, role: fields.role };
    },
  },
  copies: 'x',
} as never);

registryCreateBroker({ quests: quest as never, operations: operation as never });

// Hand-assembled tree: a `create` op nested inside a `filter`'s own `ops` — not writable through the
// chain, only through direct op-tree construction.
const handBuiltPlan = {
  recipeName: 'c19-scratch',
  ops: [
    {
      op: 'filter',
      ingredient: 'quest',
      where: { title: 'seed' },
      expect: 'one',
      matchedRef: 'quest[match]',
      ops: [
        {
          op: 'create',
          ingredient: 'operation',
          ref: 'quest[match]/operation[0:0]',
          index: 0,
          ancestors: ['quest[match]'],
          fields: { role: 'ward' },
        },
        {
          op: 'saveRecord',
          ref: 'quest[match]/operation[0:0]',
          name: 'nestedCreateResult',
        },
      ],
    },
  ],
};

console.log('parse through hydrationPlanContract (does the CONTRACT admit an OpCreate nested in a filter?):');
try {
  hydrationPlanContract.parse(handBuiltPlan);
  console.log('PARSE SUCCEEDED — the contract admits it');
} catch (error) {
  console.log('PARSE THREW:', error instanceof Error ? error.message : String(error));
}

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c19-'));
  try {
    const result = await planRunBroker({
      plan: handBuiltPlan as never,
      target: { home } as never,
      ingredients: [quest, operation] as never,
    });
    console.log('RUNNER: NO THROW. run result:', JSON.stringify(result));
    console.log('did the nested create actually run the operation write route? opSeq =', opSeq);
  } catch (error) {
    console.log('RUNNER THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  rmSync(home, { recursive: true, force: true });
})();
