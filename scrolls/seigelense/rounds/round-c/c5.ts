// C5 — `setRaw` on a transition field, then `set` on the same field:
// q[0].setRaw({status:'complete'}), q[0].set({status:'in_progress'}). Two open questions per the
// plan: does the second walk's `reach` receive `from: 'complete'` (the raw value, never produced by
// a real walk), and is that value even on the ingredient's own `to` list (declared below as
// ['created', 'in_progress'] — 'complete' is deliberately absent from it)? `reach` here records
// every `from` it is handed.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const fromsSeen: unknown[] = [];

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest whose reach records every from it is handed, and never refuses one',
  fields: looseSchema,
  record: looseSchema,
  transitions: {
    field: 'status',
    to: ['created', 'in_progress'],
    reach: ({ from, to, record }: { from: unknown; to: unknown; record: Record<PropertyKey, unknown> }) => {
      fromsSeen.push(from);
      return { ...record, status: to };
    },
  },
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => ({ id: 'q-1', status: fields.status }),
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never });

const ops = dm.quests.add(1, (q: never) => {
  const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    setRaw: (v: Record<PropertyKey, unknown>) => unknown;
    set: (v: Record<PropertyKey, unknown>) => unknown;
  };
  return [q0.setRaw({ status: 'complete' }), q0.set({ status: 'in_progress' })];
}) as unknown[];

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c5-'));
  const flatOps = ops.flat(Infinity as never);
  const result = await planRunBroker({
    plan: { recipeName: 'c5-scratch', ops: flatOps } as never,
    target: { home } as never,
    ingredients: [quest] as never,
  });
  console.log('run result:', JSON.stringify(result));
  console.log('froms seen by reach, in call order:', JSON.stringify(fromsSeen));
  rmSync(home, { recursive: true, force: true });
})();
