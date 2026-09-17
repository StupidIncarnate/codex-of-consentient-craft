// C4 — two `set`s with different transitions on the same row, in one plan:
// q[0].set({status:'approved'}), q[0].set({status:'in_progress'}). Does the second walk supersede
// the first (one walk, straight to in_progress), or does the row walk TWICE, each leg its own
// `reach` call? `reach` here records every {from,to} hop it is asked to make, and separately mints
// a "relay" marker per hop so the two orderings ("approved then in_progress" vs a single combined
// jump) are distinguishable by what actually got minted, not merely by final status.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const hops: { from: unknown; to: unknown }[] = [];
const relayMarkers: unknown[] = [];

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest whose reach records every hop and mints a relay marker per hop',
  fields: looseSchema,
  record: looseSchema,
  transitions: {
    field: 'status',
    to: ['created', 'approved', 'in_progress'],
    reach: ({ from, to, record }: { from: unknown; to: unknown; record: Record<PropertyKey, unknown> }) => {
      hops.push({ from, to });
      relayMarkers.push(`${String(from)}->${String(to)}`);
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
  return [
    q0.setRaw({ status: 'created' }),
    q0.set({ status: 'approved' }),
    q0.set({ status: 'in_progress' }),
  ];
}) as unknown[];

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c4-'));
  const flatOps = ops.flat(Infinity as never);
  const result = await planRunBroker({
    plan: { recipeName: 'c4-scratch', ops: flatOps } as never,
    target: { home } as never,
    ingredients: [quest] as never,
  });
  console.log('run result:', JSON.stringify(result));
  console.log('hops (from->to), in call order:', JSON.stringify(hops));
  console.log('relay markers minted:', JSON.stringify(relayMarkers));
  rmSync(home, { recursive: true, force: true });
})();
