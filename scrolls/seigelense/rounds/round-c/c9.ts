// C9 — a transition whose gates mint rows another transition removes: the plan's own claim is that
// `makes:` (planMakesTransformer) reports NEITHER count for the minted ingredient, and cannot even
// NAME it, wherever nothing else in the plan names it — confirming this needs no run at all
// (tier 1: planMakesTransformer reads the STATIC op tree only, never touches a target). Two plans:
// (A) two `set` transitions on a quest, no `add`/`filter` ever mentions `operation` at all — the
// relay's minted/removed rows are wholly invisible to the op tree. (B) the same plan PLUS a
// `filter` naming `operation` — the only way the listing ever mentions it, and only as `varies`.
import { registryCreateBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { planMakesTransformer } from '../../packages/hydration/src/transformers/plan-makes/plan-makes-transformer';
import { z } from 'zod';

const looseSchema = z.object({}).passthrough();

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest whose transitions mint/remove operation rows out of band (not modeled here)',
  fields: looseSchema,
  record: looseSchema,
  transitions: {
    field: 'status',
    to: ['created', 'in_progress', 'complete'],
    reach: ({ to, record }: { to: unknown; record: Record<PropertyKey, unknown> }) => ({ ...record, status: to }),
  },
  routes: { write: async () => ({ id: 'q-1' }) },
  copies: 'x',
} as never);

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'an operation row, real query route so a filter can name it',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'quest', as: 'questId' }],
  routes: { write: async () => ({ id: 'op-1' }), query: async () => [] },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never, operations: operation as never });

const planA = dm.quests.add(1, (q: never) => {
  const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    setRaw: (v: Record<PropertyKey, unknown>) => unknown;
    set: (v: Record<PropertyKey, unknown>) => unknown;
  };
  return [q0.setRaw({ status: 'created' }), q0.set({ status: 'in_progress' }), q0.set({ status: 'complete' })];
}).flat(Infinity as never);

console.log('Plan A (no filter names operation) makes:', JSON.stringify(planMakesTransformer({ plan: { recipeName: 'c9-a', ops: planA } as never })));

const planB = dm.quests.add(1, (q: never) => {
  const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    setRaw: (v: Record<PropertyKey, unknown>) => unknown;
    set: (v: Record<PropertyKey, unknown>) => unknown;
    operations: { filter: (a: { where: Record<PropertyKey, unknown> }) => { remove: () => unknown } };
  };
  return [
    q0.setRaw({ status: 'created' }),
    q0.set({ status: 'in_progress' }),
    q0.set({ status: 'complete' }),
    q0.operations.filter({ where: {} }).remove(),
  ];
}).flat(Infinity as never);

console.log('Plan B (a filter names operation) makes:', JSON.stringify(planMakesTransformer({ plan: { recipeName: 'c9-b', ops: planB } as never })));
