// C16 — a transition set through `all`: g[0].quests.add(3, (q, all) => [all.set({status:
// 'in_progress'})]). Wrong reading: one op over a set means one walk covers three rows. Expect:
// `all.set` maps the op over every ref (collection-chain-transformer.ts), each carrying the
// ingredient's own `transitions`, and the runner is serial — three real gate walks, one after
// another, not one shared write.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const ROW_COUNT = 3;
const reachCalls: unknown[] = [];
let seq = 0;

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest whose reach records every ref it is called for',
  fields: looseSchema,
  record: looseSchema,
  defaults: () => ({ status: 'created' }),
  transitions: {
    field: 'status',
    to: ['created', 'in_progress'],
    reach: ({ to, record }: { to: unknown; record: Record<PropertyKey, unknown> }) => {
      reachCalls.push({ id: record.id, to });
      return { ...record, status: to };
    },
  },
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      seq += 1;
      return { id: `q-${seq}`, status: fields.status };
    },
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never });
const ops = dm.quests.add(ROW_COUNT, (_rows: unknown, all: { set: (v: Record<PropertyKey, unknown>) => unknown }) => [
  all.set({ status: 'in_progress' }),
]).flat(Infinity as never);

const setOps = ops.filter((op: unknown) => (op as Record<PropertyKey, unknown>).op === 'set');
console.log('set ops from all.set (one per ref, each carrying its own transition):', JSON.stringify(setOps));

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c16-'));
  await planRunBroker({
    plan: { recipeName: 'c16-scratch', ops } as never,
    target: { home } as never,
    ingredients: [quest] as never,
  });
  console.log('reach calls, in order:', JSON.stringify(reachCalls));
  rmSync(home, { recursive: true, force: true });
})();
