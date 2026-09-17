// C17 — a transition set through a matched set: q[0].operations.filter({where}).set({status}).
// Wrong reading: a filter reaches EXISTING rows, so `.set()` on a matched set writes through the
// `update` route rather than walking. Expect: it walks — matched-set-chain-transformer.ts passes
// the ingredient's own `transitions` into the nested `set` op the same way the handle chain does.
// The sharper question: `reach` needs `from` off the ROW ITSELF (a row the recipe never created in
// this plan), read via `matchedRowRebindTransformer` rebinding `matchedRef` to the live record — or
// does `from` arrive undefined/defaulted, meaning the walk starts from a state the row is not in?
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const operationsStore: Record<PropertyKey, unknown>[] = [
  { id: 'op-1', role: 'ward', status: 'queued' },
];
const reachCalls: unknown[] = [];

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'a pre-seeded operation, not created by this plan, real query route',
  fields: looseSchema,
  record: looseSchema,
  transitions: {
    field: 'status',
    to: ['queued', 'complete'],
    reach: ({ from, to, record }: { from: unknown; to: unknown; record: Record<PropertyKey, unknown> }) => {
      reachCalls.push({ from, to, recordId: record.id });
      return { ...record, status: to };
    },
  },
  routes: {
    write: async () => ({ id: 'unused' }),
    query: async ({ where }: { where: Record<PropertyKey, unknown> }) =>
      operationsStore.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ operations: operation as never });
const ops = dm.operations
  .filter({ where: { role: 'ward' } } as never)
  .set({ status: 'complete' } as never);

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c17-'));
  await planRunBroker({
    plan: { recipeName: 'c17-scratch', ops: [ops].flat(Infinity as never) } as never,
    target: { home } as never,
    ingredients: [operation] as never,
  });
  console.log('reach calls (from should reflect the MATCHED row\'s own real status, "queued"):', JSON.stringify(reachCalls));
  rmSync(home, { recursive: true, force: true });
})();
