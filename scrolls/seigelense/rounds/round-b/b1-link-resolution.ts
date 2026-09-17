// B1, reading (3) — does `linkValuesTransformer` fill a row's link to an ancestor THREE LEVELS UP
// (not its immediate host) from the full op.ancestors chain? `d` links to BOTH `c` (its immediate
// host — required for the chain accessor to exist at all) and `a` (its great-grandparent), the same
// shape `operationIngredient` already proves at two levels (links to quest AND guild) in
// dm-target.ts, pushed one level deeper. Ops are built directly through the same transformers
// `collectionChainTransformer` calls internally, bypassing the chain builder's own typed surface —
// what is under test here is the RUNNER's link resolution, not the chain's type machinery (which
// `tmp/round-b/depth-fixture.ts` already exercises separately).
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { planRunBroker } from '../../packages/hydration/src/brokers/plan/run/plan-run-broker';
import { rowRefTransformer } from '../../packages/hydration/src/transformers/row-ref/row-ref-transformer';
import { opCreateTransformer } from '../../packages/hydration/src/transformers/op-create/op-create-transformer';
import { opSaveRecordTransformer } from '../../packages/hydration/src/transformers/op-save-record/op-save-record-transformer';
import type { IngredientConfigData } from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { HydrationOp } from '../../packages/hydration/src/contracts/hydration-op/hydration-op-contract';
import type { RowRef } from '../../packages/hydration/src/contracts/row-ref/row-ref-contract';
import { mkdtempSync, existsSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseFields = z.object({}).passthrough();
const looseRecord = z.object({}).passthrough();

const aIngredient = ingredientDeclareBroker({
  name: 'a',
  description: 'level one, no ancestor',
  fields: looseFields,
  record: looseRecord,
  routes: { write: async ({ fields }: { fields: Record<string, unknown> }) => ({ id: 'a-1', ...fields }) },
  copies: 'x',
} as never);

const bIngredient = ingredientDeclareBroker({
  name: 'b',
  description: 'level two, links to a',
  fields: looseFields,
  record: looseRecord,
  links: [{ of: 'a', as: 'aId' }],
  routes: { write: async ({ fields }: { fields: Record<string, unknown> }) => ({ id: 'b-1', ...fields }) },
  copies: 'x',
} as never);

const cIngredient = ingredientDeclareBroker({
  name: 'c',
  description: 'level three, links to b',
  fields: looseFields,
  record: looseRecord,
  links: [{ of: 'b', as: 'bId' }],
  routes: { write: async ({ fields }: { fields: Record<string, unknown> }) => ({ id: 'c-1', ...fields }) },
  copies: 'x',
} as never);

// d links to BOTH its immediate host (c) and its great-grandparent (a) — three levels up.
const dIngredient = ingredientDeclareBroker({
  name: 'd',
  description: 'level four, links to c AND a',
  fields: looseFields,
  record: looseRecord,
  links: [
    { of: 'c', as: 'cId' },
    { of: 'a', as: 'aId' },
  ],
  routes: { write: async ({ fields }: { fields: Record<string, unknown> }) => ({ id: 'd-1', ...fields }) },
  copies: 'x',
} as never);

const ingredients = [aIngredient, bIngredient, cIngredient, dIngredient] as unknown as readonly IngredientConfigData[];

const aOp = opCreateTransformer({ ingredient: 'a' as never, callIndex: 0 as never, index: 0 as never, ancestors: [], fields: {} as never });
const aRef: RowRef = aOp.ref;
const bOp = opCreateTransformer({ ingredient: 'b' as never, callIndex: 0 as never, index: 0 as never, ancestors: [aRef], fields: {} as never });
const bRef: RowRef = bOp.ref;
const cOp = opCreateTransformer({ ingredient: 'c' as never, callIndex: 0 as never, index: 0 as never, ancestors: [aRef, bRef], fields: {} as never });
const cRef: RowRef = cOp.ref;
const dOp = opCreateTransformer({ ingredient: 'd' as never, callIndex: 0 as never, index: 0 as never, ancestors: [aRef, bRef, cRef], fields: {} as never });
const dRef: RowRef = dOp.ref;
const saveOp = opSaveRecordTransformer({ ref: dRef, name: 'd' as never });

console.log('op ancestors at each level:', JSON.stringify({
  a: aOp.ancestors,
  b: bOp.ancestors,
  c: cOp.ancestors,
  d: dOp.ancestors,
}));
console.log('refs:', JSON.stringify({ aRef, bRef, cRef, dRef }));

const ops = [aOp, bOp, cOp, dOp, saveOp] as unknown as readonly HydrationOp[];

const home = mkdtempSync(join(tmpdir(), 'dm-b1-'));

(async () => {
  try {
    const result = await planRunBroker({
      plan: { recipeName: 'b1-scratch' as never, ops } as never,
      target: { home } as never,
      ingredients,
    });
    console.log('NO THROW. Result:', JSON.stringify(result));
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  const entries = existsSync(home) ? readdirSync(home) : ['<home does not exist>'];
  console.log('HOME CONTENTS after run:', JSON.stringify(entries));
  rmSync(home, { recursive: true, force: true });
})();
