// C10 — a `filter`'s placeholder reference colliding with a real row's. The plan predicts the two
// refs are the SAME STRING (both derived as `operation[0]` from the OLD row-ref shape), calling
// this the add-against-filter case section 4b's own review of filter-against-filter did not cover.
// The shipped `matchedRefTransformer` now derives the placeholder from a dedicated
// `rowRefStatics.slot.matchWord`, not a digit pair — check whether that already closes it, the same
// way B6/B7 found `callIndex` already closed THEIR predicted collision.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const operationsStore: Record<PropertyKey, unknown>[] = [];
let opSeq = 0;

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest row, write-only',
  fields: looseSchema,
  record: looseSchema,
  routes: { write: async () => ({ id: 'q-1' }) },
  copies: 'x',
} as never);

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'an operation row, real write/query/remove routes',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'quest', as: 'questId' }],
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      opSeq += 1;
      const row = { id: `op-${opSeq}`, role: fields.role, questId: fields.questId };
      operationsStore.push(row);
      return row;
    },
    query: async ({ where }: { where: Record<PropertyKey, unknown> }) =>
      operationsStore.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
    remove: async ({ record }: { record: Record<PropertyKey, unknown> }) => {
      const index = operationsStore.findIndex((row) => row.id === record.id);
      if (index >= 0) {
        operationsStore.splice(index, 1);
      }
      return undefined;
    },
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never, operations: operation as never });

const ops = dm.quests.add(1, (q: never) => {
  const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    operations: {
      add: (n: number, b: (o: unknown) => unknown[]) => unknown;
      filter: (a: { where: Record<PropertyKey, unknown>; expect: string }) => { remove: () => unknown };
    };
  };
  return [
    q0.operations.add(1, (o: unknown) => {
      const o0 = (o as Record<PropertyKey, unknown>[])[0] as unknown as { set: (v: Record<PropertyKey, unknown>) => unknown };
      return [o0.set({ role: 'ward' })];
    }),
    q0.operations.filter({ where: { role: 'riftcarver' }, expect: 'any' } as never).remove(),
  ];
}).flat(Infinity as never);

const allCreateRefs = ops
  .filter((op: unknown) => (op as Record<PropertyKey, unknown>).op === 'create')
  .map((op: unknown) => (op as Record<PropertyKey, unknown>).ref);
const operationCreateRef = ops
  .filter((op: unknown) => (op as Record<PropertyKey, unknown>).op === 'create' && (op as Record<PropertyKey, unknown>).ingredient === 'operation')
  .map((op: unknown) => (op as Record<PropertyKey, unknown>).ref)[0];
const filterRef = (ops.find((op: unknown) => (op as Record<PropertyKey, unknown>).op === 'filter') as Record<PropertyKey, unknown>).matchedRef;
console.log('every create ref:        ', JSON.stringify(allCreateRefs));
console.log('the ADDED operation ref: ', JSON.stringify(operationCreateRef));
console.log('the filter matchedRef:   ', JSON.stringify(filterRef));
console.log('are they equal?          ', operationCreateRef === filterRef);

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c10-'));
  console.log('operationsStore BEFORE:', JSON.stringify(operationsStore));
  await planRunBroker({
    plan: { recipeName: 'c10-scratch', ops } as never,
    target: { home } as never,
    ingredients: [quest, operation] as never,
  });
  console.log('operationsStore AFTER: ', JSON.stringify(operationsStore));
  rmSync(home, { recursive: true, force: true });
})();
